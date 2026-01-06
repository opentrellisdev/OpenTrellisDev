const axios = require('axios')

const BASE_URL = process.env.ADMIN_API_BASE_URL || 'http://localhost:3000'

async function testAdminAPI() {
  try {
    console.log('🧪 Testing Admin API endpoints...\n')

    // Test mentor applications endpoint
    console.log('📋 Testing /api/admin/mentor-applications...')
    try {
      const applicationsResponse = await axios.get(`${BASE_URL}/api/admin/mentor-applications`)
      console.log('✅ Applications API working')
      console.log(`   Found ${applicationsResponse.data.length} applications`)
      applicationsResponse.data.forEach(app => {
        console.log(`   - ${app.user.username} (${app.user.email}): ${app.status}`)
      })
    } catch (error) {
      console.log('❌ Applications API error:', error.response?.status, error.response?.data)
    }

    // Test current mentors endpoint
    console.log('\n👥 Testing /api/admin/current-mentors...')
    try {
      const mentorsResponse = await axios.get(`${BASE_URL}/api/admin/current-mentors`)
      console.log('✅ Current mentors API working')
      console.log(`   Found ${mentorsResponse.data.length} current mentors`)
    } catch (error) {
      console.log('❌ Current mentors API error:', error.response?.status, error.response?.data)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAdminAPI() 