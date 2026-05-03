// Using native fetch (Node.js 18+)

const API_BASE_URL = 'http://localhost:5001/api';

async function testEndpoint(endpoint, method = 'GET', body = null) {
    console.log(`Testing ${method} ${endpoint}...`);
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ Success: ${response.status} ${response.statusText}`);
        } else {
            console.log(`❌ Failed: ${response.status} ${response.statusText}`);
            console.log('Error Body:', data);
        }
    } catch (err) {
        console.log(`❌ Error connecting to API: ${err.message}`);
    }
    console.log('-------------------');
}

async function runTests() {
    console.log('Starting Authentication Bypass Verification...\n');

    // 1. Test Admin stats (protected route)
    await testEndpoint('/admin/dashboard-stats');

    // 2. Test Farmers list (protected route)
    await testEndpoint('/admin/farmers');

    // 3. Test Milk records (protected route)
    await testEndpoint('/admin/milk-records');

    // 4. Test Update settings (protected PUT route)
    await testEndpoint('/admin/settings', 'PUT', { siteName: 'AmataLink (No Auth)' });

    // 5. Test Add milk record (protected POST route)
    // Note: farmerId 1 must exist for this to work perfectly, but we just check if it gets past 401/403
    await testEndpoint('/milk/record', 'POST', { farmerId: 1, liters: 5 });

    console.log('Verification Finished.');
}

runTests();
