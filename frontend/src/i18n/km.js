import shared from './km/shared'
import layout from './km/layout'
import auth from './km/auth'
import users from './km/users'
import dashboard from './km/dashboard'
import foundation from './km/foundation'

export default {
  ...shared,
  ...layout,
  ...auth,
  ...users,
  ...dashboard,
  ...foundation,
}
