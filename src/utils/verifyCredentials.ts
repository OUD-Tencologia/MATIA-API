import bcrypt from 'bcryptjs';
import profile from '../models/profile.js'

export const verifyCredentials = async (password: string, email: string) => {
  const user = await profile.unscoped().findOne({
    where: { email },
  })

  if (!user) {
    return null
  }

  const hashedPassword = user.get('profile_password') as string

  if (!hashedPassword) {
    return null
  }

  const isPasswordValid = await bcrypt.compare(password, hashedPassword)

  if (isPasswordValid) {
    const userJson = user.toJSON()
    const userData: Record<string, any> = userJson

    delete userData.profile_password

    return userData
  } else {
    return null
  }
}
