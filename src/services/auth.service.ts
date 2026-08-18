import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../models/user';

export class AuthService {
  private auth = getAuth();
  private userRepository = new UserRepository();

  async signUp(email: string, password: string, tenantId: string): Promise<void> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const user: User = {
      id: userCredential.user.uid,
      email,
      roles: ['STUDENT'],
      tenantId,
      provider: 'email'
    };
    await this.userRepository.createUser(user);
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }
}
