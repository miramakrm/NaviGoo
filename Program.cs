using Microsoft.Data.Sqlite;
using Dapper;
using System.Text.Json;
using System.Data;

var builder = WebApplication.CreateBuilder(args);
var connectionString = "Data Source=wwwroot/Recommendations.db";
builder.Services.AddScoped<IDbConnection>(sp => new SqliteConnection(connectionString));

var app = builder.Build();
using (var connection = new SqliteConnection(connectionString))
{
  connection.Open();
  connection.Execute(@"
       CREATE TABLE IF NOT EXISTS Recommendations (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Title TEXT NOT NULL,
        Description TEXT NOT NULL,
        ImageUrl TEXT NOT NULL UNIQUE,
        Price DECIMAL(10, 2) NOT NULL,
        Currency TEXT NOT NULL DEFAULT 'EGP'
    )");
}
app.MapGet("/", async context =>
{
  context.Response.Headers["Content-Type"] = "text/html";
  await context.Response.SendFileAsync("wwwroot/index.html");
});
app.UseStaticFiles();
app.MapGet("/recommendations", async (HttpContext context, IDbConnection db) =>
{
  var recommendations = (await db.QueryAsync<Recommendation>("SELECT * FROM Recommendations")).ToList();
  return Results.Ok(recommendations);
});
app.MapPost("/add-recommendation", async (HttpContext context, IDbConnection db) =>
{
  try
  {
    var title = context.Request.Form["title"].ToString().Trim();
    var description = context.Request.Form["description"].ToString().Trim();
    var imageUrl = context.Request.Form.Files["imageUrl"];
    var price = decimal.Parse(context.Request.Form["price"].ToString());
    var currency = context.Request.Form["currency"].ToString().Trim();

    if (string.IsNullOrEmpty(title))
    {
      return Results.BadRequest("Name is required");
    }
    if (string.IsNullOrEmpty(description))
    {
      return Results.BadRequest("Write a Description");
    }
    if (imageUrl == null || imageUrl.Length == 0)
    {
      return Results.BadRequest("Image is required");
    }

    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
    var extension = Path.GetExtension(imageUrl.FileName).ToLowerInvariant();
    if (!allowedExtensions.Contains(extension))
    {
      return Results.BadRequest("Invalid file type, only jpg, jpeg, png, gif are allowed.");
    }

    var imageAddress = "";
    if (imageUrl != null && imageUrl.Length > 0)
    {
      var fileTitle = Guid.NewGuid().ToString() + Path.GetExtension(imageUrl.FileName);
      var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
      Directory.CreateDirectory(uploadPath);
      var filePath = Path.Combine(uploadPath, fileTitle);

      using (var stream = new FileStream(filePath, FileMode.Create))
      {
        await imageUrl.CopyToAsync(stream);
      }
      imageAddress = Path.Combine("/uploads", fileTitle);
    }
var existingRecommendation = await db.QueryFirstOrDefaultAsync<Recommendation>(
    "SELECT * FROM Recommendations WHERE Title = @Title", new { Title = title });

if (existingRecommendation != null)
{
    return Results.BadRequest("Recommendation with this title already exists.");
}
    var result = await db.ExecuteAsync(
        "INSERT INTO Recommendations (Title, Description, ImageUrl, Price, Currency) VALUES (@Title, @Description, @ImageUrl, @Price, @Currency);",
        new { Title = title, Description = description, ImageUrl = imageAddress, Price = price, Currency = currency });

    if (result > 0)
    {
      return Results.Ok(new
      {
        Message = "Recommendation added successfully",
        Data = new
        {
          Title = title,
          Description = description,
          ImageUrl = imageAddress,
          Price = price,
          Currency = currency
        }
      });
    }

    return Results.Json(new { Message = "Failed to add the recommendation. Please try again later." }, statusCode: 500);
  
  }
  catch (Exception ex)
  {
    Console.Error.WriteLine(ex.Message);
    return Results.Json(new { Message = "An error occurred while processing your request." }, statusCode: 500);
  }
});



app.MapDelete("/delete-recommendation", async (HttpContext context, IDbConnection db) =>
{
  var form = await context.Request.ReadFormAsync();
  var title = form["title"].ToString().Trim();
  if (string.IsNullOrEmpty(title))
  {
    return Results.BadRequest("Name is required to be deleted");
  }
  var recommendation = await db.QueryFirstOrDefaultAsync<Recommendation>(
    "SELECT * FROM Recommendations WHERE Title = @Title", new { Title = title });

  if (recommendation == null)
  {
    return Results.BadRequest("recommendation not found");
  }

  var deleted = await db.ExecuteAsync(
        "DELETE FROM Recommendations WHERE Title = @Title", new { Title = title });

    return deleted > 0
        ? Results.Ok(new { message = "Recommendation deleted successfully" })
        : Results.NotFound(new { message = "Recommendation could not be deleted" });
});

app.Run();


public class Recommendation
{
  public int Id { get; set; }
  public string? Title { get; set; }
  public string? Description { get; set; }
  public string? ImageUrl { get; set; }
  public decimal Price { get; set; }
  public string Currency { get; set; } = "EGP";

}