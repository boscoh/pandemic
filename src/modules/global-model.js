const _ = require('lodash')

function clearDict (aDict) {
  for (let key of _.keys(aDict)) {
    delete aDict[key]
  }
}

class GlobalModel {
  constructor (isIntervention) {
    this.countryIndices = []

    this.isIntervention = !!isIntervention

    this.countryModel = {}

    this.vars = {
      incidence: 0,
      prevalence: 0
    }

    this.solution = {
      incidence: [],
      prevalence: []
    }

    this.getTravelPerDay = null

    this.startTime = 0
    this.time = 0
    this.times = []
    this.dTimeInDay = 1

    this.interventionDay = null
  }

  setCountryModel (countryIndices, ModelClass, sourceCountryName) {
    this.countryIndices = countryIndices
    clearDict(this.countryModel)
    for (let iCountry of this.countryIndices) {
      this.countryModel[iCountry] = new ModelClass(sourceCountryName)
    }
  }

  getGuiParams () {
    if (_.keys(this.countryModel).length > 0) {
      let result = this.countryModel[0].getGuiParams()
      if (!this.isIntervention) {
        let intervention = _.find(result, e => e.key === 'interventionDay')
        if (intervention) {
          this.interventionDay = intervention.value
        }
      }
      return result
    } else {
      return []
    }
  }

  getInterventionParams () {
    if (_.keys(this.countryModel).length > 0) {
      let result = this.countryModel[0].getInterventionParams()
      if (!this.isIntervention) {
        let intervention = _.find(result, e => e.key === 'interventionDay')
        if (intervention) {
          this.interventionDay = intervention.value
        }
      }
      return result
    } else {
      return []
    }
  }

  makeIntervention (inputParams) {
    let intervention = new this.constructor(true)
    intervention.startTime = this.time
    intervention.times.length = 0
    intervention.getTravelPerDay = this.getTravelPerDay
    intervention.countryIndices = _.clone(this.countryIndices)
    for (let i of this.countryIndices) {
      let countryModel = _.cloneDeep(this.countryModel[i])
      intervention.countryModel[i] = countryModel
      countryModel.applyIntervention(inputParams)
    }
    return intervention
  }

  makeSingleCountryIntervention (inputParams, iCountry) {
    let intervention = new this.constructor(true)
    intervention.startTime = this.time
    intervention.times.length = 0
    intervention.getTravelPerDay = this.getTravelPerDay
    intervention.countryIndices = _.clone(this.countryIndices)
    for (let i of this.countryIndices) {
      let countryModel = _.cloneDeep(this.countryModel[i])
      intervention.countryModel[i] = countryModel
      if (i === iCountry) {
        countryModel.applyIntervention(inputParams)
      }
    }
    return intervention
  }

  makeDoubleCountryIntervention (inputParams, iCountry1, iCountry2) {
    let intervention = new this.constructor(true)
    intervention.startTime = this.time
    intervention.times.length = 0
    intervention.getTravelPerDay = this.getTravelPerDay
    intervention.countryIndices = _.clone(this.countryIndices)
    for (let i of this.countryIndices) {
      let countryModel = _.cloneDeep(this.countryModel[i])
      intervention.countryModel[i] = countryModel
      if (i === iCountry1) {
        countryModel.applyIntervention(inputParams)
      } else if (i === iCountry2) {
        countryModel.applyIntervention(inputParams)
      }
    }
    return intervention
  }

  transferInfectiousPeople () {
    if (!this.getTravelPerDay) {
      throw new Error('GlobalModel.getTravelPerDay function not set!')
    }

    for (let iFromCountry of this.countryIndices) {
      let fromCountry = this.countryModel[iFromCountry]
      for (let iToCountry of this.countryIndices) {
        if (iFromCountry !== iToCountry) {
          fromCountry.transferInfectiousTo(
            this.countryModel[iToCountry],
            this.getTravelPerDay(iFromCountry, iToCountry)
          )
        }
      }
    }
  }

  clearSolutions () {
    this.solution.incidence.length = 0
    this.solution.prevalence.length = 0
    this.times.length = 0
    this.time = this.startTime
    for (let iCountry of this.countryIndices) {
      this.countryModel[iCountry].clearSolutions()
    }
  }

  update () {
    this.time += this.dTimeInDay
    this.times.push(this.time)

    for (let countryModel of _.values(this.countryModel)) {
      countryModel.clearBeforeTransfer()
    }

    // sets countryModel.delta and countryModel.importIncidence
    this.transferInfectiousPeople()

    this.vars.incidence = 0
    this.vars.prevalence = 0

    for (let countryModel of _.values(this.countryModel)) {
      countryModel.runStep(this.dTimeInDay)

      countryModel.solution.importIncidence.push(
        countryModel.var.importIncidence
      )
      this.vars.prevalence += countryModel.compartment.infectious
      this.vars.incidence += _.last(countryModel.solution.incidence)
    }

    this.solution.incidence.push(this.vars.incidence)
    this.solution.prevalence.push(this.vars.prevalence)
  }
}

export { GlobalModel }
