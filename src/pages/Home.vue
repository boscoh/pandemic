<template>
  <v-layout
    row
    style="
      height: calc(100vh - 58px);
      width: calc(100vw);"
  >
    <div
      style="
        height: calc(100vh - 58px);
        width: 50%"
    >
      <div
        style="
          overflow-y: scroll;
          height: calc(100vh - 58px);
          padding: 1em;"
      >
        <v-layout column>
          <v-card style="padding: 1em;">
            <h3 class="headline">
              Global Pandemic Model
            </h3>

            <p>
              This is an interactive visualization for predicting emerging
              pandemics. Select the source country below (or double-click on the
              globe), and see the predicted risk of pandemic on the globe to the
              right. Scroll down to see graphs of the progression of the risk
              pandemic for individual countries, and for the global response.
            </p>

            <v-layout
              row
              align-center
            >
              <div
                style="
                  display: inline;
                  color: red;
                  font-size: 1.5em;
                  line-height: 1em;
                  height: 1em;
                  min-height: 1em;
                  margin-right: 0.2em"
              >
                &#9606;
              </div>

              <v-select
                v-model="iSourceCountry"
                :items="selectableCountries"
                label="Source Country"
                item-text="name"
                item-value="iCountry"
                style="
                  padding-left: 0.2em;
                  flex: 1;
                  margin-right: 1em"
                @change="asyncSelectSourceCountry()"
              ></v-select>
            </v-layout>
          </v-card>

          <v-card style="padding: 1em;  margin-top: 1em">
            <h3 class="headline">
              Model Parameters
            </h3>

            <p>
              Choose the type of compartmental model of the epidemic, and modify
              the parameters and the initial conditions of the epidemic model at
              the source country.
            </p>

            <v-layout
              row
              align-content-center
            >
              <v-select
                v-model="modelType"
                :items="modelTypes"
                style="margin-right: 1em;"
                label="Model"
                @change="asyncSelectNewModel"
              ></v-select>
            </v-layout>

            <v-layout
              column
              align-content-center
            >
              <div
                v-for="(entry, i) in guiParams"
                :key="i"
              >
                <v-text-field
                  v-if="!entry.isReadOnly"
                  v-model="entry.value"
                  :label="entry.label"
                  :max="entry.max"
                  :step="entry.step"
                  style="
                  width: 100%;
                  margin-right: 1em;"
                  type="number"
                  @change="asyncCalculateRisk"
                ></v-text-field>
                <v-text-field
                  v-else-if="entry.isReadOnly"
                  :value="entry.getValue()"
                  :label="entry.label"
                  :disabled="true"
                  type="number"
                ></v-text-field>
              </div>
            </v-layout>
          </v-card>

          <v-card
            v-if="interventionParams.length > 0"
            style="padding: 1em; margin-top: 1em"
          >
            <h3 class="headline">
              Intervention Parameters
            </h3>

            <p>
              Interventions are modeled by modification of the parameters of the
              epidemic after the start date of the epidemic. Below, choose the
              start date of the intervention, the effect of the intervention on
              the parameters of the epidemic, and the countries to which the
              intervention will be applied.
            </p>

            <v-radio-group
              v-model="interventionMode"
              @change="asyncCalculateRisk"
            >
              <v-radio
                label="All Countries"
                value="all-countries"
              ></v-radio>
              <v-radio
                label="Source Country Only"
                value="source-country-only"
              ></v-radio>
              <v-radio
                value="watch-country-only"
                label="Watch Country Only"
              ></v-radio>
              <v-radio
                label="Source and Watch Countries"
                value="watch-and-source-countries"
              ></v-radio>
            </v-radio-group>

            <div
              v-for="(entry, i) in interventionParams"
              :key="i"
            >
              <v-text-field
                v-if="!entry.isReadOnly"
                v-model="entry.value"
                :label="entry.label"
                :max="entry.max"
                :step="entry.step"
                style="
                width: 100%;
                margin-right: 1em;"
                type="number"
                @change="asyncCalculateRisk"
              ></v-text-field>
              <v-text-field
                v-else-if="entry.isReadOnly"
                :value="entry.getValue()"
                :label="entry.label"
                :disabled="true"
                type="number"
              ></v-text-field>
            </div>
          </v-card>

          <v-card style="padding: 1em; margin-top: 1em">
            <v-layout
              column
              align-start
            >
              <h3 class="headline">
                Model the Pandemic over Time
              </h3>

              <p>
                Select the time interval of the simulation from the initial
                state that was defined above. Animate allows the simulation to
                automatically progress day-by-day. Adjust Max Days for the
                display of the graphs below.
              </p>

              <v-radio-group
                v-model="mode"
                @change="asyncSelectMode"
              >
                <v-radio
                  label="Show Pandemic Prediction"
                  value="risk"
                ></v-radio>
                <v-radio
                  label="Show Travel Data Only"
                  value="destination"
                ></v-radio>
              </v-radio-group>

              <v-switch
                v-model="isLoop"
                label="Animate"
                @change="toggleLoop"
              ></v-switch>

              <v-layout
                style="width: 100%"
                row
                align-center
              >
                Day {{ days }} &nbsp; &nbsp;

                <v-slider
                  v-model="days"
                  :interval="1"
                  :min="1"
                  :max="getMaxDays"
                  tooltip="none"
                  @change="asyncCalculateRisk()"
                ></v-slider>
              </v-layout>

              <v-text-field
                v-model="maxDays"
                label="Max days on chart"
                type="number"
                @change="asyncCalculateRisk"
              ></v-text-field>
            </v-layout>
          </v-card>

          <v-card style="padding: 1em; margin-top: 1em">
            <h3 class="headline">
              Source Country Pandemic Predictions
            </h3>

            <p>
              Progression of the pandemic for the chosen Source Country.
            </p>

            <v-layout
              v-show="mode === 'risk'"
              id="sourceCharts"
              row
              wrap
            ></v-layout>
          </v-card>

          <v-card style="padding: 1em; margin-top: 1em">
            <h3 class="headline">
              Global Pandemic Predictions
            </h3>

            <p>
              Progression of the risk of pandemic summed over all the countries.
            </p>

            <v-layout
              v-show="mode === 'risk'"
              id="globalCharts"
              row
              wrap
            ></v-layout>
          </v-card>

          <v-card style="padding: 1em; margin-top: 1em">
            <h3 class="headline">
              Watch Country Pandemic Predictions
            </h3>

            <p>
              Progression of the pandemic for the chosen Watch Country. You can
              select the Watch Country either through the drop-down or clicking
              on the globe on the right.
            </p>

            <v-layout
              row
              align-center
            >
              <div
                style="
                  display: inline;
                  color: green;
                  font-size: 1.5em;
                  line-height: 1em;
                  height: 1em;
                  min-height: 1em;
                  margin-right: 0.2em"
              >
                &#9744;
              </div>

              <v-select
                v-model="iWatchCountry"
                :items="selectableCountries"
                label="Watch Country"
                item-text="name"
                item-value="iCountry"
                style="
                  padding-left: 0.2em;
                  flex: 1;
                  margin-right: 1em"
                @change="asyncSelectSourceCountry()"
              ></v-select>
            </v-layout>

            <v-layout
              v-show="mode === 'risk'"
              id="watchCharts"
              row
              wrap
            ></v-layout>
          </v-card>
        </v-layout>
      </div>
    </div>

    <div
      style="
        height: calc(100vh - 58px);
        flex: 1;
        border-left: 1px solid #CCC;
        overflow: hidden;
        padding: 1em;
        "
    >
      <v-card
        style="
          height: calc(100vh - 58px - 2em);
          padding: 1em;"
      >
        <v-layout
          column
          style="
            height: 100%;
            box-sizing: border-box;
            padding: 0 15px;"
        >
          <div v-if="isRunning">
            <h2
              class="headline"
              style="
                opacity: 0.2;
                background-color: #DDD;
                line-height: 1em"
            >
              {{ title }}
            </h2>
            <div
              style="
                margin-top: 0.5em;
                line-height: 1.5em;
                padding-left: 0.2em;
                color: #F00;
                background-color: #FCC"
            >
              Calculating...
            </div>
          </div>
          <div v-else>
            <h2
              class="headline"
              style="line-height: 1em"
            >
              {{ title }}
            </h2>
            <div
              style="
                margin-top: 0.5em;
                line-height: 1.5em;"
            >
              &nbsp;
            </div>
          </div>

          <v-layout
            id="main"
            style="
              background-color: white;
              width: 100%"
          ></v-layout>

          <v-text-field
            v-if="mode === 'risk'"
            v-model="maxPrevalence"
            label="Prevalence of Saturated Color"
            style="width: 200px;"
            @change="asyncCalculateRisk()"
          ></v-text-field>
        </v-layout>
      </v-card>
    </div>
  </v-layout>
</template>

<style>
p {
  margin-top: 0.8em;
}

.countryTooltip {
  display: none;
  pointer-events: none;
  background: #fff;
  padding: 5px;
  text-align: left;
  border: solid #ccc 1px;
  color: #666;
  font-size: 14px;
  font-family: sans-serif;
}

.chart {
  width: 400px;
  height: 300px;
  margin-bottom: 1.5em;
}
</style>

<script>
import _ from 'lodash'
import $ from 'jquery'
import numeral from 'numeral'

import util from '../modules/util'
import { Globe } from '../modules/globe'
import { models } from '../modules/models'
import ChartWidget from '../modules/chart-widget'
import { GlobalModel } from '../modules/global-model'

const flightData = require('../data/flight-data')
const adjacentData = require('../data/adjacent-data')

function waitForElement (selector) {
  return new Promise(resolve => {
    function loop () {
      let $element = $(selector)
      if ($element.length) {
        resolve($element)
      } else {
        window.setTimeout(loop, 50)
      }
    }

    loop()
  })
}

function acumulateValues (vals) {
  let result = []
  for (let i of _.range(vals.length)) {
    let val = _.sum(vals.slice(0, i + 1))
    result.push(val)
  }
  return result
}

function convertLabel (val) {
  val = parseFloat(val)
  if (val > 1) {
    return numeral(val).format('0a')
  }
  if (val === 0) {
    return '0'
  } else {
    return numeral(val).format('0.0[000000]')
  }
}

function formatInt (i) {
  if (i < 1) {
    return '< 1'
  } else {
    return i.toFixed(0)
  }
}

let isDef = x => !_.isNil(x)

export default {
  /**
   * There are three indexes
   * - country ID
   * - iCountry based on countries
   * - and an index based on the world.json files
   *
   * It's important to keep these distinguished with
   * the correct variable names.
   */

  data () {
    let modelTypes = _.map(models, 'name')
    return {
      selectableCountries: [],
      iSourceCountry: -1,
      iWatchCountry: -1,
      mode: 'risk', // or 'destination'
      days: 15,
      isRunning: false,
      maxDays: 60,
      maxPrevalence: 20,
      title: '',
      interventionMode: 'all-countries', // 'source-country-only'
      guiParams: [],
      interventionParams: [],
      isLoop: false,
      modelType: modelTypes[0],
      modelTypes: modelTypes
    }
  },

  computed: {
    /**
     * Needed as md-input corrupts this.maxDays into string
     * @returns {number}
     */
    getMaxDays () {
      return parseFloat(this.maxDays)
    }
  },

  async mounted () {
    this.isRunning = false

    this.$element = $('#main')
    this.loopTimeStepMs = 2000

    this.resize()
    window.addEventListener('resize', () => this.resize())

    this.globe = new Globe('#main')
    this.globe.getPopupHtmlFromGlobe = this.getPopupHtmlFromGlobe
    this.globe.dblclickCountry = this.selectSourceCountryFromGlobe
    this.globe.clickCountry = this.selectWatchCountryFromGlobe

    this.mode = 'risk' // 'destination' or 'risk'
    this.flightData = flightData
    // data is for Feb, 2015 {
    //   'travel': [
    //      [ ... ['AUS', 33, 444],... ],
    //      ....
    //   ],
    //   'countries': [ { 'name': 'Australia', 'iso_n3': '781', 'iso_a3': 'AUS },... ]
    // }

    this.selectableCountries = []
    let nCountry = this.flightData.countries.length
    for (let iCountry = 0; iCountry < nCountry; iCountry += 1) {
      let country = flightData.countries[iCountry]
      let query = { iso_n3: country.iso_n3 }
      let properties = this.globe.getPropertiesFromQuery(query)
      if (isDef(properties)) {
        this.selectableCountries.push({
          iCountry,
          iso_n3: properties.iso_n3,
          iso_a3: properties.iso_a3,
          name: properties.name,
          population: parseInt(properties.pop_est)
        })
      } else {
        console.log(`Couldn't match ${JSON.stringify(country)} to map data`)
      }
    }
    this.countryIndices = _.map(this.selectableCountries, 'iCountry')
    this.selectableCountries = _.sortBy(this.selectableCountries, a => a.name)

    this.iSourceCountry = 0

    this.adjacentData = adjacentData
    this.adjacent = {} // { iCountry: [iCountry,...], ... }
    for (let entry of this.adjacentData.neighbours) {
      let isoN3 = entry.country
      let iCountry = this.getICountry(isoN3)
      if (isDef(iCountry)) {
        this.adjacent[iCountry] = _.reject(
          _.map(entry.neighbours, this.getICountry),
          _.isNil
        )
      }
    }

    this.travel = Array(nCountry) // n x n matrix of floats - travelPerDay
    for (let iCountryFrom of _.range(nCountry)) {
      this.travel[iCountryFrom] = _.fill(Array(nCountry), 0)
      for (let iCountryTo of this.countryIndices) {
        this.travel[iCountryFrom][iCountryTo] =
          this.flightData.travel[iCountryFrom][iCountryTo][1] / 28
      }

      // hack to simulate land neighbors
      let maxFlightTravel = _.max(this.travel[iCountryFrom])
      let query = { iso_n3: this.flightData.countries[iCountryFrom].iso_n3 }
      let features = this.globe.getPropertiesFromQuery(query)
      if (_.isNil(features)) {
        continue
      }
      let travelPerCapita = maxFlightTravel / features.pop_est
      let landNeighbors = this.adjacent[iCountryFrom]
      if (_.isNil(landNeighbors)) {
        continue
      }
      for (let iCountryTo of landNeighbors) {
        let query = { iso_n3: this.flightData.countries[iCountryTo].iso_n3 }
        features = this.globe.getPropertiesFromQuery(query)
        if (_.isNil(features)) {
          continue
        }
        this.travel[iCountryFrom][iCountryTo] +=
          travelPerCapita * features.pop_est
      }
    }

    this.globalModel = new GlobalModel()
    this.globalModel.getTravelPerDay = this.getTravelPerDay

    this.isRunning = false

    this.setNewEpiModel()

    this.chartWidgets = {}

    await this.asyncMakeChartWidget(
      '#sourceCharts',
      'sourcePrevalence',
      'Number of Active Infections',
      'Time (days)'
    )
    await this.asyncMakeChartWidget(
      '#sourceCharts',
      'sourceImportIncidence',
      'Cumulative Import Incidence',
      'Time (days)'
    )

    await this.asyncMakeChartWidget(
      '#globalCharts',
      'globalPrevalence',
      'Global Number of Active Infections',
      'Time (days)'
    )
    await this.asyncMakeChartWidget(
      '#globalCharts',
      'cumulativeIncidence',
      'Global Cumulative Incidence',
      'Time (days)'
    )
    await this.asyncMakeChartWidget(
      '#watchCharts',
      'watchPrevalence',
      'Number of Active Infections',
      'Time (days)'
    )
    await this.asyncMakeChartWidget(
      '#watchCharts',
      'watchImportIncidence',
      'Cumulative Import Incidence',
      'Time (days)'
    )

    window.dispatchEvent(new Event('resize'))

    await this.asyncSelectRandomSourceCountry()

    setInterval(this.loop, this.loopTimeStepMs)

    this.globe.resize()
  },

  methods: {
    async asyncMakeChartWidget (parentSelector, id, title, xLabel) {
      let $parent = $(parentSelector)
      await waitForElement($parent)
      $parent.append($(`<div id="${id}" class="chart">`))
      let selector = `#${id}`
      await waitForElement(selector)
      let chartWidget = new ChartWidget(selector)
      chartWidget.setYLabel('')
      chartWidget.addDataset('model')
      chartWidget.addDataset('intervention')
      chartWidget.setXLabel(xLabel)
      chartWidget.setTitle(title)

      let options = chartWidget.getChartOptions()
      options.scales.yAxes[0].ticks.callback = convertLabel
      this.chartWidgets[id] = chartWidget
    },

    getSourceCountryId () {
      return this.flightData.countries[this.iSourceCountry].iso_n3
    },

    getICountry (id) {
      for (let country of this.selectableCountries) {
        if (id === country.iso_n3) {
          return country.iCountry
        }
      }
    },

    getNameFromICountry (iCountry) {
      if (isDef(this.flightData)) {
        let query = { iso_n3: this.flightData.countries[iCountry].iso_n3 }
        return this.globe.getPropertiesFromQuery(query).admin
      } else {
        return ''
      }
    },

    getPrevalenceByCountryId () {
      let result = {}
      for (let iCountry of this.countryIndices) {
        let id = this.flightData.countries[iCountry].iso_n3
        let countryModel = this.globalModel.countryModel[iCountry]
        result[id] = countryModel.compartment.infectious
      }
      return result
    },

    resize () {
      let position = this.$element.position()
      this.$element.height(window.innerHeight - position.top)
      if (this.globe) {
        this.globe.resize()
      }
    },

    getTravelPerDay (iCountryFrom, iCountryTo) {
      return this.travel[iCountryFrom][iCountryTo]
    },

    getTravelValuesByCountryId () {
      let values = {}
      let nCountry = this.flightData.countries.length
      for (let jCountry = 0; jCountry < nCountry; jCountry += 1) {
        let value
        value = this.getTravelPerDay(this.iSourceCountry, jCountry)
        let id = this.flightData.countries[jCountry].iso_n3
        values[id] = value
      }
      return values
    },

    setNewEpiModel () {
      let oldInputParams = {}
      for (let paramEntry of this.guiParams) {
        oldInputParams[paramEntry.key] = paramEntry.value
      }

      let oldInterventionInputParams = {}
      for (let paramEntry of this.interventionParams) {
        oldInterventionInputParams[paramEntry.key] = paramEntry.value
      }

      let ModelClass
      for (let model of models) {
        if (model.name === this.modelType) {
          ModelClass = model.Class
        }
      }

      let sourceCountryName = this.getNameFromICountry(this.iSourceCountry)
      this.globalModel.setCountryModel(
        this.countryIndices,
        ModelClass,
        sourceCountryName
      )
      this.guiParams = this.globalModel.getGuiParams()
      this.interventionParams = this.globalModel.getInterventionParams()

      for (let paramEntry of this.guiParams) {
        if (paramEntry.key in oldInputParams) {
          paramEntry.value = oldInputParams[paramEntry.key]
        }
        if (paramEntry.step === 0.01) {
          paramEntry.value = parseFloat(paramEntry.value).toFixed(2)
        }
        if (paramEntry.isReadOnly) {
          paramEntry.value = paramEntry.getValue()
        }
      }

      for (let paramEntry of this.interventionParams) {
        if (paramEntry.key in oldInterventionInputParams) {
          paramEntry.value = oldInterventionInputParams[paramEntry.key]
        }
        if (paramEntry.step === 0.01) {
          paramEntry.value = parseFloat(paramEntry.value).toFixed(2)
        }
      }
    },

    parameterizeGlobalModelFromInput () {
      for (let iCountry of this.countryIndices) {
        let countryModel = this.globalModel.countryModel[iCountry]
        countryModel.importGuiParams(this.guiParams)
        countryModel.param.initPrevalence = 0
        let query = { iso_n3: this.flightData.countries[iCountry].iso_n3 }
        let pop = this.globe.getPropertiesFromQuery(query).pop_est
        countryModel.param.initPopulation = pop
      }

      this.intervention = null
      this.globalModel.interventionDay = null
      let entry = _.find(
        this.interventionParams,
        e => e.key === 'interventionDay'
      )
      if (entry) {
        this.globalModel.interventionDay = parseInt(entry.value)
      }
    },

    calculateRiskOfSourceCountry () {
      this.parameterizeGlobalModelFromInput()

      let countryModel = this.globalModel.countryModel[this.iSourceCountry]

      let param = _.find(this.guiParams, p => p.key === 'initPrevalence')
      let initPrevalence = parseFloat(param.value)

      // Run model from prevalence = 10 to prevalence = initPrevalence

      countryModel.param.initPrevalence = 10

      this.globalModel.clearSolutions()
      for (let countryModel of _.values(this.globalModel.countryModel)) {
        countryModel.clearSolutions()
        countryModel.initCompartments()
      }

      while (countryModel.compartment.infectious < initPrevalence) {
        this.globalModel.update()
      }

      this.dayStart = _.last(this.globalModel.times)

      // Run model for the number of days, whilst keeping track of
      // intervention

      this.interventionDay = this.globalModel.interventionDay
      this.interventionDay += this.dayStart

      while (_.last(this.globalModel.times) < this.dayStart + this.days) {
        this.globalModel.update()
        if (this.globalModel.time === this.interventionDay) {
          if (this.interventionMode === 'all-countries') {
            this.intervention = this.globalModel.makeIntervention(
              this.interventionParams
            )
          } else if (this.interventionMode === 'source-country-only') {
            this.intervention = this.globalModel.makeSingleCountryIntervention(
              this.interventionParams,
              this.iSourceCountry
            )
          } else if (this.interventionMode === 'watch-country-only') {
            this.intervention = this.globalModel.makeSingleCountryIntervention(
              this.interventionParams,
              this.iWatchCountry
            )
          } else if (this.interventionMode === 'watch-and-source-countries') {
            this.intervention = this.globalModel.makeDoubleCountryIntervention(
              this.interventionParams,
              this.iSourceCountry,
              this.iWatchCountry
            )
          }
        }
      }

      if (this.intervention) {
        this.intervention.clearSolutions()
        let interventionDays = this.days - this.globalModel.interventionDay
        _.times(interventionDays, () => {
          this.intervention.update()
        })
      }

      // reorder times to start at 0 for main model

      this.showMaxDays = this.maxDays

      for (let i = 0; i < this.globalModel.times.length; i += 1) {
        this.globalModel.times[i] -= this.dayStart
      }

      if (this.intervention) {
        for (let i = 0; i < this.intervention.times.length; i += 1) {
          this.intervention.times[i] -= this.dayStart
        }
      }

      // clear intervention graphs
      for (let chart of _.values(this.chartWidgets)) {
        chart.updateDataset(1, [], [])
      }

      this.updateSourceCharts()
      this.updateGlobalCharts()
    },

    updateSourceCharts () {
      if (this.iSourceCountry < 0) {
        return
      }

      let countryModel = this.globalModel.countryModel[this.iSourceCountry]
      if (_.isUndefined(countryModel)) {
        return
      }
      let solution = countryModel.solution

      let interventionSolution = null
      if (this.intervention) {
        interventionSolution = this.intervention.countryModel[
          this.iSourceCountry
        ].solution
      }

      solution.cumulativeImportIncidence = acumulateValues(
        solution.importIncidence
      )
      if (interventionSolution) {
        let i = this.interventionDay - 1
        let offset = solution.cumulativeImportIncidence[i]
        let newValues = acumulateValues(interventionSolution.importIncidence)
        interventionSolution.cumulativeImportIncidence = _.map(
          newValues,
          v => v + offset
        )
      }

      this.chartWidgets.sourcePrevalence.setXMax(this.showMaxDays)
      this.chartWidgets.sourcePrevalence.updateDataset(
        0,
        this.globalModel.times,
        solution.infectious
      )
      if (interventionSolution) {
        this.chartWidgets.sourcePrevalence.updateDataset(
          1,
          this.intervention.times,
          interventionSolution.infectious
        )
      }

      this.chartWidgets.sourceImportIncidence.setXMax(this.showMaxDays)
      this.chartWidgets.sourceImportIncidence.updateDataset(
        0,
        this.globalModel.times,
        solution.cumulativeImportIncidence
      )
      if (interventionSolution) {
        this.chartWidgets.sourceImportIncidence.updateDataset(
          1,
          this.intervention.times,
          interventionSolution.cumulativeImportIncidence
        )
      }
    },

    updateGlobalCharts () {
      this.chartWidgets.globalPrevalence.setXMax(this.showMaxDays)
      this.chartWidgets.globalPrevalence.updateDataset(
        0,
        this.globalModel.times,
        this.globalModel.solution.prevalence
      )
      if (this.intervention) {
        this.chartWidgets.globalPrevalence.updateDataset(
          1,
          this.intervention.times,
          this.intervention.solution.prevalence
        )
      }

      this.globalModel.solution.cumulativeIncidence = acumulateValues(
        this.globalModel.solution.incidence
      )
      if (this.intervention) {
        let i = this.interventionDay - 1
        let offset = this.globalModel.solution.cumulativeIncidence[i]
        let newValues = acumulateValues(this.intervention.solution.incidence)
        this.intervention.solution.cumulativeIncidence = _.map(
          newValues,
          v => v + offset
        )
      }

      this.chartWidgets.cumulativeIncidence.setXMax(this.showMaxDays)
      this.chartWidgets.cumulativeIncidence.updateDataset(
        0,
        this.globalModel.times,
        this.globalModel.solution.cumulativeIncidence
      )
      if (this.intervention) {
        this.chartWidgets.cumulativeIncidence.updateDataset(
          1,
          this.intervention.times,
          this.intervention.solution.cumulativeIncidence
        )
      }
    },

    updateWatchCountry () {
      if (this.iWatchCountry < 0) {
        return
      }

      let countryModel = this.globalModel.countryModel[this.iWatchCountry]
      if (_.isUndefined(countryModel)) {
        return
      }
      let solution = countryModel.solution

      let interventionSolution = null
      if (this.intervention) {
        interventionSolution = this.intervention.countryModel[
          this.iWatchCountry
        ].solution
      }

      solution.cumulativeImportIncidence = acumulateValues(
        solution.importIncidence
      )
      if (interventionSolution) {
        let i = this.interventionDay - 1
        let offset = solution.cumulativeImportIncidence[i]
        let newValues = acumulateValues(interventionSolution.importIncidence)
        interventionSolution.cumulativeImportIncidence = _.map(
          newValues,
          v => v + offset
        )
      }

      this.chartWidgets.watchPrevalence.setXMax(this.showMaxDays)
      this.chartWidgets.watchPrevalence.updateDataset(
        0,
        this.globalModel.times,
        solution.infectious
      )
      if (interventionSolution) {
        this.chartWidgets.watchPrevalence.updateDataset(
          1,
          this.intervention.times,
          interventionSolution.infectious
        )
      }

      this.chartWidgets.watchImportIncidence.setXMax(this.showMaxDays)
      this.chartWidgets.watchImportIncidence.updateDataset(
        0,
        this.globalModel.times,
        solution.cumulativeImportIncidence
      )
      if (interventionSolution) {
        this.chartWidgets.watchImportIncidence.updateDataset(
          1,
          this.intervention.times,
          interventionSolution.cumulativeImportIncidence
        )
      }
    },

    async asyncRecalculateGlobe () {
      while (this.isRunning) {
        await util.delay(100)
      }

      this.isRunning = true

      let title = ''
      if (this.mode === 'risk') {
        title += 'Risk of Pandemic Originating in '
        title += this.getNameFromICountry(this.iSourceCountry)
        title += ' after ' + this.days + ' days'
      } else {
        title += 'People travelling from '
        title += this.getNameFromICountry(this.iSourceCountry)
      }
      this.title = title

      // give time for Vue to update elements
      await util.delay(300)

      let valuesById, maxValue

      if (_.startsWith(this.mode, 'risk')) {
        this.calculateRiskOfSourceCountry()
        valuesById = this.getPrevalenceByCountryId()
        valuesById[this.getSourceCountryId()] = 0
        maxValue = this.maxPrevalence
        this.updateWatchCountry()
      } else {
        valuesById = this.getTravelValuesByCountryId()
      }

      for (let [id, value] of _.toPairs(valuesById)) {
        let i = this.globe.iCountryFromId[id]
        this.globe.values[i] = value
      }
      let i = this.globe.iCountryFromId[this.getSourceCountryId()]
      this.globe.values[i] = 0
      let modeColors = {
        destination: '#02386F',
        risk: '#f0f'
      }
      this.globe.resetCountryColorsFromValues(modeColors[this.mode], maxValue)
      this.globe.colors[i] = '#f00'
      this.globe.draw()
      this.globe.drawLegend()

      this.isRunning = false
    },

    async asyncSelectNewModel () {
      await util.delay(100)
      this.setNewEpiModel()
      this.parameterizeGlobalModelFromInput()
      await this.asyncRecalculateGlobe()
    },

    rotateToCountry (iCountry) {
      let country = this.flightData.countries[iCountry]
      let i = this.globe.iCountryFromId[country.iso_n3]
      this.globe.rotateTransitionToICountry(i)
    },

    async asyncSelectSourceCountry () {
      await this.asyncRecalculateGlobe()
      this.rotateToCountry(this.iSourceCountry)
    },

    selectWatchCountryFromGlobe (iGlobeCountry) {
      let id = this.globe.features[iGlobeCountry].properties.iso_n3
      this.iWatchCountry = parseInt(this.getICountry(id))
      console.log('Home.selectWatchCountry', iGlobeCountry, id)
      let iNewHighlight = this.globe.iCountryFromId[id]
      if (iNewHighlight !== this.globe.iHighlightCountry) {
        this.globe.iHighlightCountry = iNewHighlight
        this.globe.drawHighlight()
        this.updateWatchCountry()
      }
    },

    async asyncSelectWatchCountry () {
      await util.delay(100)
      console.log('> Home.asyncSelectWatchCountry', this.iWatchCountry)
      this.updateWatchCountry()
      let id = this.flightData.countries[this.iWatchCountry].iso_n3
      this.globe.iHighlightCountry = this.globe.iCountryFromId[id]
      this.globe.drawHighlight()
      this.rotateToCountry(this.iWatchCountry)
    },

    selectSourceCountryFromGlobe (iGlobeCountry) {
      let countryId = this.globe.features[iGlobeCountry].properties.iso_n3
      let country = _.find(
        this.selectableCountries,
        c => c.iso_n3 === countryId
      )
      if (isDef(country)) {
        this.iSourceCountry = country.iCountry
        this.asyncSelectSourceCountry()
      }
    },

    async asyncSelectRandomSourceCountry () {
      let n = this.selectableCountries.length
      let i = Math.floor(Math.random() * Math.floor(n))
      this.iSourceCountry = this.selectableCountries[i].iCountry
      this.iWatchCountry = this.iSourceCountry
      await this.asyncSelectSourceCountry()
    },

    async asyncSelectMode () {
      await util.delay(100)
      console.log('> Home.asyncSelectMode', this.mode)
      this.asyncRecalculateGlobe()
    },

    async asyncCalculateRisk () {
      await util.delay(100)
      this.mode = 'risk'
      await this.asyncRecalculateGlobe()
    },

    loop () {
      if (this.isLoop && _.startsWith(this.mode, 'risk')) {
        if (this.days < this.getMaxDays) {
          this.days += 1
        } else {
          this.days = 1
        }
        this.asyncCalculateRisk()
      }
    },

    toggleLoop (boolValue) {
      this.isLoop = boolValue
      if (this.isLoop) {
        this.mode = 'risk'
      }
    },

    getPopupHtmlFromGlobe (iGlobeCountry) {
      let feature = this.globe.features[iGlobeCountry]
      let id = feature.properties.iso_n3
      let name = feature.properties.name
      let population = feature.properties.pop_est

      let sourceId = this.flightData.countries[this.iSourceCountry].iso_n3
      let s = `<div style="text-align: left">`

      if (this.mode === 'destination') {
        let j = this.globe.iCountryFromId[id]
        if (id === sourceId) {
          s += `Source country of travel: ${name}`
        } else {
          let value = this.globe.values[j]
          if (value === null) {
            s += `(No travel data available for ${name})`
          } else {
            let countryName = this.getNameFromICountry(this.iSourceCountry)
            s += `People travelling from ${countryName}`
            s += `<br>&nbsp; To ${name} (pop: ${population})`
            s += `<br>&nbsp; Average Per Day: ` + formatInt(value)
          }
        }
      }

      if (this.mode === 'risk') {
        let nCountry = this.flightData.countries.length
        let prevalence = null
        let country = null
        let solution = null
        for (let iCountry = 0; iCountry < nCountry; iCountry += 1) {
          let countryId = this.flightData.countries[iCountry].iso_n3
          if (countryId === id) {
            country = this.globalModel.countryModel[iCountry]
            prevalence = country.compartment.infectious
            solution = country.solution
            break
          }
        }
        if (_.isNil(prevalence)) {
          s += `(No prediction due to lack of travel data)`
        } else {
          s += `Prediction in ${name}`
          if (id === sourceId) {
            s += ` (source)`
          }
          s += `<br> &nbsp; After ${this.days} days`
          s +=
            `<br> &nbsp; Number of Active Infections: ` + formatInt(prevalence)
          let cumulativeImportIncidence = _.last(
            acumulateValues(solution.importIncidence)
          )
          s +=
            `<br> &nbsp; Cumulative Import incidence: ` +
            formatInt(cumulativeImportIncidence)
        }
      }

      s += `</div>`
      return s
    }
  }
}
</script>
