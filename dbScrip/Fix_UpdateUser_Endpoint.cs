// Fix the /api/users/update endpoint to support password updates

// Update this section in MapUserManagementRoutes:

// Update
group.MapPut("/update", async (UpdateUserDto dto, IConfiguration config) =>
{
    var parameters = new List<SqlParameter>
    {
        new SqlParameter("@UserId", dto.UserId),
        new SqlParameter("@FullName", dto.FullName),
        new SqlParameter("@Email", dto.Email),
        new SqlParameter("@RoleId", dto.RoleId),
        new SqlParameter("@IsActive", dto.IsActive)
    };

    // Add password parameter if provided (for password reset)
    if (!string.IsNullOrEmpty(dto.Password))
    {
        // Hash the password before sending to SP
        var hashedPassword = PasswordHelper.ComputeSha256Hash(dto.Password);
        parameters.Add(new SqlParameter("@Password", hashedPassword));
    }
    else
    {
        parameters.Add(new SqlParameter("@Password", DBNull.Value));
    }

    var result = await DailyDeliverySqlHelper.ExecuteScalarAsync(config, "sp_UpdateUser", parameters.ToArray());
    return Results.Ok(new { Affected = Convert.ToInt32(result) });
});

// And update the UpdateUserDto class:
public class UpdateUserDto
{
    public int UserId { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
    public int RoleId { get; set; }
    public bool IsActive { get; set; }
    public string? Password { get; set; }  // Optional - for password reset
}
