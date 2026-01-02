
const md5 = '799f73aec3c7199f76b020c5ffe96ecc';
const rapidHost = 'annas-archive-api.p.rapidapi.com';

async function testInvalidKey() {
    const url = `https://${rapidHost}/download?md5=${md5}`;

    console.log('Testing with undefined key...');
    try {
        const response = await fetch(url, {
            headers: {
                'x-rapidapi-key': 'undefined', // simulates undefined being stringified
                'x-rapidapi-host': rapidHost
            }
        });

        console.log('Status (undefined key):', response.status);
        const data = await response.json();
        console.log('Data:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

testInvalidKey();
