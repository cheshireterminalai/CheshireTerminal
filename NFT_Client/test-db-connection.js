const databaseService = require('./services/database-service');

async function testConnection() {
  try {
    console.log('Starting database connection test...');
    
    // Initialize connection
    await databaseService.initialize();
    console.log('Successfully connected to AstraDB!');
    
    // Test creating a collection
    const collectionName = 'test_collection';
    await databaseService.createCollection(collectionName);
    console.log('Successfully created test collection');
    
    // Test inserting a document
    const testDoc = {
      _id: '1',
      name: 'Test Document',
      timestamp: new Date().toISOString()
    };
    await databaseService.insertDocument(collectionName, testDoc);
    console.log('Successfully inserted test document');
    
    // Test retrieving documents
    const docs = await databaseService.findDocuments(collectionName, {});
    console.log('Retrieved documents:', docs);
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  }
}

console.log('Starting test script...');
testConnection().catch(error => {
  console.error('Unhandled error:', error);
});
