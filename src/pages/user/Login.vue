<template>
  <v-container>
    <v-layout
      justify-center
      row
    >
      <v-flex
        xs8
        md4
        lg4
      >
        <v-card class="mt-5">
          <v-card-title
            primary-title
            class="headline"
          >
            Login to {{ title }}
          </v-card-title>

          <v-card-text>
            <form
              novalidate
              @submit.prevent="submit"
            >
              <v-text-field
                v-model="user.email"
                v-validate="'email'"
                :error-messages="errors.collect('email')"
                label="E-mail address"
                data-vv-name="email"
              ></v-text-field>

              <v-text-field
                v-model="rawPassword"
                v-validate="'required|min:6'"
                :append-icon="passwordHidden ? 'visibility' : 'visibility_off'"
                :append-icon-cb="() => (passwordHidden = !passwordHidden)"
                :type="passwordHidden ? 'password' : 'text'"
                :error-messages="errors.collect('rawPassword')"
                hint="At least 6 characters"
                counter
                label="Password"
                data-vv-name="rawPassword"
              ></v-text-field>

              <p style="margin-bottom: 2em">
                <router-link to="/forgot-password">
                  Forgot
                </router-link>
                your password?
              </p>

              <v-btn
                type="submit"
                class="v-accent"
              >
                Login
              </v-btn>

              <div
                v-if="error"
                style="color: red"
              >
                {{ error }}
              </div>

              <div style="margin-top: 2em">
                New to {{ title }}? &nbsp;
                <router-link to="/register">
                  Register
                </router-link>
              </div>
            </form>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import auth from '../../modules/auth'
import config from '../../config'

export default {
  data () {
    return {
      title: config.title,
      passwordHidden: true,
      rawPassword: '',
      error: ''
    }
  },
  computed: {
    user: {
      get () {
        return this.$store.state.user
      },
      set (u) {
        this.$store.commit('setUser', u)
      }
    }
  },
  methods: {
    async submit () {
      this.error = ''
      let payload = {
        email: this.user.email,
        rawPassword: this.rawPassword
      }
      console.log('> Login.submit', payload)
      let response = await auth.login(payload)
      console.log('> Login.submit response', response)

      if (response.result) {
        this.$router.push('/')
      } else {
        this.error = response.error.message
      }
    }
  }
}
</script>
