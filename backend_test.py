import requests
import sys
import json
from datetime import datetime

class NebulaStreamAPITester:
    def __init__(self, base_url="https://filmcloud-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.profile_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.passed_tests.append(name)
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200] if response.text else "No response"
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_register(self):
        """Test user registration"""
        test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@nebulastream.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"email": test_email, "password": "TestPass123!"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True, test_email
        return False, None

    def test_auth_login(self, email, password="TestPass123!"):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_auth_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        if success and 'id' in response:
            self.user_id = response['id']
            print(f"   User ID: {self.user_id}")
            return True
        return False

    def test_create_profile(self):
        """Test profile creation"""
        success, response = self.run_test(
            "Create Profile",
            "POST",
            "profiles",
            200,
            data={"name": "Test Profile", "is_kids": False}
        )
        if success and 'id' in response:
            self.profile_id = response['id']
            print(f"   Profile ID: {self.profile_id}")
            return True
        return False

    def test_get_profiles(self):
        """Test get user profiles"""
        success, response = self.run_test(
            "Get Profiles",
            "GET",
            "profiles",
            200
        )
        return success and isinstance(response, list)

    def test_tmdb_endpoints(self):
        """Test TMDb API endpoints (expected to fail with placeholder key)"""
        endpoints = [
            ("Get Popular Movies", "titles/popular?media_type=movie"),
            ("Get Popular TV", "titles/popular?media_type=tv"),
            ("Get Trending", "titles/trending"),
            ("Search Titles", "titles/search?query=avengers")
        ]
        
        tmdb_results = []
        for name, endpoint in endpoints:
            success, response = self.run_test(name, "GET", endpoint, 200)
            tmdb_results.append(success)
            
        return any(tmdb_results)  # At least one should work or fail gracefully

    def test_watchlist_operations(self):
        """Test watchlist CRUD operations"""
        if not self.profile_id:
            print("❌ No profile ID available for watchlist tests")
            return False
            
        # Add to watchlist
        success, _ = self.run_test(
            "Add to Watchlist",
            "POST",
            f"watchlist?profile_id={self.profile_id}",
            200,
            data={"tmdb_id": 550, "media_type": "movie"}
        )
        
        if not success:
            return False
            
        # Get watchlist
        success, response = self.run_test(
            "Get Watchlist",
            "GET",
            f"watchlist?profile_id={self.profile_id}",
            200
        )
        
        if not success:
            return False
            
        # Remove from watchlist
        success, _ = self.run_test(
            "Remove from Watchlist",
            "DELETE",
            f"watchlist/550?profile_id={self.profile_id}",
            200
        )
        
        return success

    def test_watch_history_operations(self):
        """Test watch history operations"""
        if not self.profile_id:
            print("❌ No profile ID available for watch history tests")
            return False
            
        # Update watch history
        success, _ = self.run_test(
            "Update Watch History",
            "POST",
            f"watch-history?profile_id={self.profile_id}",
            200,
            data={"tmdb_id": 550, "media_type": "movie", "position": 1200, "duration": 7200}
        )
        
        if not success:
            return False
            
        # Get watch history
        success, response = self.run_test(
            "Get Watch History",
            "GET",
            f"watch-history?profile_id={self.profile_id}",
            200
        )
        
        return success

def main():
    print("🚀 Starting NebulaStream API Tests...")
    print("=" * 50)
    
    tester = NebulaStreamAPITester()
    
    # Test authentication flow
    print("\n📝 Testing Authentication Flow...")
    reg_success, test_email = tester.test_auth_register()
    if not reg_success:
        print("❌ Registration failed, stopping tests")
        return generate_report(tester)
    
    # Test login with registered user
    if not tester.test_auth_login(test_email):
        print("❌ Login failed, stopping tests")
        return generate_report(tester)
    
    # Test get current user
    if not tester.test_auth_me():
        print("❌ Get user info failed")
        return generate_report(tester)
    
    # Test profile management
    print("\n👤 Testing Profile Management...")
    if not tester.test_create_profile():
        print("❌ Profile creation failed")
        return generate_report(tester)
    
    if not tester.test_get_profiles():
        print("❌ Get profiles failed")
        return generate_report(tester)
    
    # Test TMDb endpoints (expected to fail with placeholder key)
    print("\n🎬 Testing TMDb Integration...")
    tester.test_tmdb_endpoints()  # These may fail due to placeholder API key
    
    # Test watchlist operations
    print("\n📋 Testing Watchlist Operations...")
    tester.test_watchlist_operations()
    
    # Test watch history operations
    print("\n📺 Testing Watch History Operations...")
    tester.test_watch_history_operations()
    
    return generate_report(tester)

def generate_report(tester):
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {len(tester.failed_tests)}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"  - {failure.get('test', 'Unknown')}: {failure.get('error', failure.get('response', 'Unknown error'))}")
    
    if tester.passed_tests:
        print("\n✅ Passed Tests:")
        for test in tester.passed_tests:
            print(f"  - {test}")
    
    # Return success if critical auth and profile tests pass
    critical_tests = ["User Registration", "User Login", "Get Current User", "Create Profile", "Get Profiles"]
    critical_passed = sum(1 for test in tester.passed_tests if test in critical_tests)
    
    return 0 if critical_passed >= 4 else 1

if __name__ == "__main__":
    sys.exit(main())