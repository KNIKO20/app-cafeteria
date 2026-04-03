import unittest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from core.application.use_cases.login_with_google import LoginWithGoogleUseCase
from core.domain.entities.user import User, UserRole
from tests.fakes.fake_user_repository import FakeUserRepository
from tests.fakes.fake_auth_provider import FakeAuthProvider

class TestLoginWithGoogleUseCase(unittest.TestCase):
    def setUp(self):
        self.user_repo = FakeUserRepository()
        self.auth_provider = FakeAuthProvider()
        self.use_case = LoginWithGoogleUseCase(self.user_repo, self.auth_provider)
        
        # Add existing user
        self.user_repo.save(User(
            id="test@alumno.com",
            email="test@alumno.com",
            name="Alumno de Prueba",
            role=UserRole.STUDENT
        ))

    def test_login_existing_user(self):
        result = self.use_case.execute("valid_token")
        self.assertEqual(result.email, "test@alumno.com")
        self.assertTrue(result.token.startswith("header."))

    def test_login_new_user_creates_account(self):
        result = self.use_case.execute("new_user_token")
        self.assertEqual(result.email, "nuevo@alumno.com")
        
        # Check if saved
        saved_user = self.user_repo.find_by_email("nuevo@alumno.com")
        self.assertIsNotNone(saved_user)

    def test_invalid_token_raises_error(self):
        with self.assertRaises(ValueError):
            self.use_case.execute("invalid")

if __name__ == "__main__":
    unittest.main()
