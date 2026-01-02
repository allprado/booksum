
const rapidKey = '5b02950f3fmshebd59fd3c6c7941p1c0af1jsn450cbe689d30';
const rapidHost = 'annas-archive-api.p.rapidapi.com';

async function testFullFlow() {
    const query = 'Paulo Coelho';
    const searchUrl = `https://${rapidHost}/search?q=${encodeURIComponent(query)}&cat=fiction%2C%20nonfiction%2C%20comic%2C%20magazine%2C%20musicalscore%2C%20other%2C%20unknown&page=1&ext=pdf%2C%20epub%2C%20mobi%2C%20azw3&source=libgenLi%2C%20libgenRs`;

    console.log('Searching...');
    const searchRes = await fetch(searchUrl, { headers: { 'x-rapidapi-key': rapidKey, 'x-rapidapi-host': rapidHost } });
    const searchData = await searchRes.json();

    if (searchData.books && searchData.books.length > 0) {
        const book = searchData.books[0];
        console.log(`Found: ${book.title}, MD5: ${book.md5}`);

        console.log('Downloading links...');
        const downUrl = `https://${rapidHost}/download?md5=${book.md5}`;
        const downRes = await fetch(downUrl, { headers: { 'x-rapidapi-key': rapidKey, 'x-rapidapi-host': rapidHost } });
        console.log('Download Status:', downRes.status);
        const downData = await downRes.json();
        console.log('Download Links:', downData);
    } else {
        console.log('No books found');
    }
}

testFullFlow();
