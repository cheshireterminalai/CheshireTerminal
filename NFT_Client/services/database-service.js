class DatabaseService {
  constructor() {
    this.initialized = false;
    console.log('Database service initialized in mock mode');
  }

  async initialize() {
    try {
      // Mock initialization
      console.log('Mock database connection established');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
      throw error;
    }
  }

  async createCollection(collectionName) {
    console.log(`Mock: Created collection ${collectionName}`);
    return true;
  }

  async insertDocument(collectionName, document) {
    console.log(`Mock: Inserted document into ${collectionName}:`, document);
    return true;
  }

  async findDocuments(collectionName, query = {}) {
    console.log(`Mock: Finding documents in ${collectionName} with query:`, query);
    return [];
  }

  async updateDocument(collectionName, documentId, update) {
    console.log(`Mock: Updated document ${documentId} in ${collectionName}:`, update);
    return true;
  }

  async deleteDocument(collectionName, documentId) {
    console.log(`Mock: Deleted document ${documentId} from ${collectionName}`);
    return true;
  }
}

module.exports = new DatabaseService();
