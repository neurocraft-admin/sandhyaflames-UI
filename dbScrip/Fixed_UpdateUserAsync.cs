// Fixed UpdateUserAsync method - add to SqlHelper.cs

public static async Task<bool> UpdateUserAsync(string connStr, int userId, UpdateUserRequest user)
{
    using var conn = new SqlConnection(connStr);
    using var cmd = new SqlCommand("sp_UpdateUser", conn)
    {
        CommandType = CommandType.StoredProcedure
    };

    cmd.Parameters.AddWithValue("@UserId", userId);
    cmd.Parameters.AddWithValue("@FullName", user.FullName);
    cmd.Parameters.AddWithValue("@Email", user.Email);
    cmd.Parameters.AddWithValue("@RoleId", user.RoleId);
    cmd.Parameters.AddWithValue("@IsActive", user.IsActive);
    
    // Add password parameter if provided (for password reset)
    if (!string.IsNullOrEmpty(user.Password))
    {
        cmd.Parameters.AddWithValue("@Password", user.Password);
    }
    else
    {
        cmd.Parameters.AddWithValue("@Password", DBNull.Value);
    }

    await conn.OpenAsync();
    
    // Use ExecuteScalarAsync to read the 'success' value from SP result
    var result = await cmd.ExecuteScalarAsync();
    return result != null && Convert.ToInt32(result) > 0;
}

// Make sure UpdateUserRequest has these properties:
public class UpdateUserRequest
{
    public string FullName { get; set; }
    public string Email { get; set; }
    public int RoleId { get; set; }
    public bool IsActive { get; set; }
    public string? Password { get; set; }  // Optional - for password reset
}
