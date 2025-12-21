╔══════════════════════════════════════════════════════════════════════════════╗
║                    CUSTOMER MANAGEMENT API SPECIFICATION                     ║
║                         Backend Implementation Guide                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 OVERVIEW
-----------
Create a new CustomersController in your .NET Core API following the existing 
architecture pattern used for Drivers, Vehicles, and Products.

Base URL: https://localhost:7183/api
Controller Route: /api/customers

All stored procedures are already created. Run: sp_CustomerManagement.sql


═══════════════════════════════════════════════════════════════════════════════
🔷 ENDPOINT 1: GET ALL CUSTOMERS
═══════════════════════════════════════════════════════════════════════════════

METHOD: GET
URL: /api/customers
Stored Procedure: sp_GetCustomers
Parameters: None

RESPONSE (200 OK):
[
  {
    "CustomerId": 1,
    "CustomerName": "Rajesh Kumar",
    "Phone": "9876543210",
    "Email": "rajesh@example.com",
    "Address": "123 Main Street, Gandhi Nagar",
    "City": "Bangalore",
    "Pincode": "560001",
    "GSTNumber": "29ABCDE1234F1Z5",
    "CustomerType": "Commercial",
    "IsActive": true,
    "CreatedAt": "2025-12-21T10:30:00"
  },
  {
    "CustomerId": 2,
    "CustomerName": "Priya Sharma",
    "Phone": "9123456789",
    "Email": null,
    "Address": "456 Park Avenue",
    "City": "Mumbai",
    "Pincode": "400001",
    "GSTNumber": null,
    "CustomerType": "Retail",
    "IsActive": true,
    "CreatedAt": "2025-12-20T14:15:00"
  }
]


═══════════════════════════════════════════════════════════════════════════════
🔷 ENDPOINT 2: GET CUSTOMER BY ID
═══════════════════════════════════════════════════════════════════════════════

METHOD: GET
URL: /api/customers/{id}
Stored Procedure: sp_GetCustomerById
Parameters: @CustomerId (from route)

EXAMPLE: GET /api/customers/1

RESPONSE (200 OK):
{
  "CustomerId": 1,
  "CustomerName": "Rajesh Kumar",
  "Phone": "9876543210",
  "Email": "rajesh@example.com",
  "Address": "123 Main Street, Gandhi Nagar",
  "City": "Bangalore",
  "Pincode": "560001",
  "GSTNumber": "29ABCDE1234F1Z5",
  "CustomerType": "Commercial",
  "IsActive": true,
  "CreatedAt": "2025-12-21T10:30:00"
}

RESPONSE (404 Not Found):
{
  "message": "Customer not found"
}


═══════════════════════════════════════════════════════════════════════════════
🔷 ENDPOINT 3: CREATE/UPDATE CUSTOMER
═══════════════════════════════════════════════════════════════════════════════

METHOD: POST
URL: /api/customers
Stored Procedure: sp_SaveCustomer
Content-Type: application/json

REQUEST PAYLOAD (CREATE - CustomerId = 0):
{
  "customerId": 0,
  "customerName": "Amit Patel",
  "phone": "9988776655",
  "email": "amit.patel@example.com",
  "address": "789 Business Park, Sector 5",
  "city": "Pune",
  "pincode": "411001",
  "gstNumber": "27XYZAB5678C1D9",
  "customerType": "Industrial",
  "isActive": true
}

REQUEST PAYLOAD (UPDATE - CustomerId > 0):
{
  "customerId": 5,
  "customerName": "Amit Patel (Updated)",
  "phone": "9988776655",
  "email": "amit.new@example.com",
  "address": "789 Business Park, Sector 5",
  "city": "Pune",
  "pincode": "411001",
  "gstNumber": "27XYZAB5678C1D9",
  "customerType": "Commercial",
  "isActive": true
}

RESPONSE (200 OK):
{
  "success": 1,
  "message": "Customer created successfully"
}
OR
{
  "success": 1,
  "message": "Customer updated successfully"
}

ERROR RESPONSES:
{
  "message": "Customer name is required"
}
{
  "message": "A customer with this phone number already exists"
}


═══════════════════════════════════════════════════════════════════════════════
🔷 ENDPOINT 4: SOFT DELETE CUSTOMER
═══════════════════════════════════════════════════════════════════════════════

METHOD: PUT
URL: /api/customers/{id}
Stored Procedure: sp_SoftDeleteCustomer
Parameters: @CustomerId (from route)

EXAMPLE: PUT /api/customers/5

REQUEST BODY: (can be empty or include { "isActive": false })

RESPONSE (200 OK):
{
  "success": 1,
  "message": "Customer deactivated successfully"
}

ERROR RESPONSE:
{
  "message": "Customer not found"
}


═══════════════════════════════════════════════════════════════════════════════
🔷 ENDPOINT 5: GET ACTIVE CUSTOMERS (For Dropdowns)
═══════════════════════════════════════════════════════════════════════════════

METHOD: GET
URL: /api/customers/active
Stored Procedure: sp_GetActiveCustomers
Parameters: None

RESPONSE (200 OK):
[
  {
    "CustomerId": 1,
    "CustomerName": "Rajesh Kumar",
    "Phone": "9876543210",
    "City": "Bangalore",
    "CustomerType": "Commercial"
  },
  {
    "CustomerId": 2,
    "CustomerName": "Priya Sharma",
    "Phone": "9123456789",
    "City": "Mumbai",
    "CustomerType": "Retail"
  }
]


═══════════════════════════════════════════════════════════════════════════════
📝 BACKEND IMPLEMENTATION CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

☐ 1. Run sp_CustomerManagement.sql to create database objects
☐ 2. Create CustomersController.cs in Controllers folder
☐ 3. Add [Route("api/[controller]")] and [ApiController] attributes
☐ 4. Inject IConfiguration for connection string
☐ 5. Implement 5 endpoints as specified above
☐ 6. Use SqlCommand with CommandType.StoredProcedure
☐ 7. Handle nullable fields (Email, GSTNumber) with DBNull.Value
☐ 8. Return proper HTTP status codes (200, 404, 500)
☐ 9. Add try-catch blocks for error handling
☐ 10. Test all endpoints with Postman/Swagger


═══════════════════════════════════════════════════════════════════════════════
🎯 IMPLEMENTATION PROMPT FOR .NET DEVELOPER
═══════════════════════════════════════════════════════════════════════════════

TASK: Create a new CustomersController in the .NET Core API

REQUIREMENTS:
1. Follow the existing pattern used in DriversController and VehiclesController
2. Create a Web API controller at: Controllers/CustomersController.cs
3. Implement 5 RESTful endpoints as specified in this document
4. Use the stored procedures already created (sp_CustomerManagement.sql)
5. Map the request/response payloads exactly as shown above
6. Handle null values for Email and GSTNumber fields appropriately
7. Return success/error responses matching the format above
8. Use async/await pattern for all database operations
9. Add proper exception handling and logging

STORED PROCEDURES AVAILABLE:
- sp_GetCustomers (returns all customers)
- sp_GetCustomerById (returns single customer)
- sp_SaveCustomer (insert/update based on CustomerId)
- sp_SoftDeleteCustomer (marks customer as inactive)
- sp_GetActiveCustomers (returns only active customers)

CONNECTION STRING:
Use the existing DefaultConnection from appsettings.json

VALIDATION:
- All validation is handled in stored procedures
- Frontend validates phone (10 digits) and pincode (6 digits)
- Backend should return meaningful error messages from SP

TESTING:
After implementation, verify:
✓ GET /api/customers returns array
✓ POST /api/customers creates new customer
✓ POST /api/customers updates existing customer
✓ PUT /api/customers/{id} soft deletes customer
✓ GET /api/customers/active returns only active customers


═══════════════════════════════════════════════════════════════════════════════
📊 CURRENT STATUS
═══════════════════════════════════════════════════════════════════════════════

✅ Angular Frontend: COMPLETE
   - Customer model created
   - Customer service created
   - Customer list component created
   - Customer form with validation
   - Routes configured
   - Navigation menu updated

✅ Database: COMPLETE
   - Customers table created
   - All stored procedures created
   - Indexes added for performance
   - Validation rules implemented

⏳ Backend API: PENDING IMPLEMENTATION
   - Need to create CustomersController.cs
   - Need to implement 5 endpoints
   - Need to test with Angular frontend

═══════════════════════════════════════════════════════════════════════════════
