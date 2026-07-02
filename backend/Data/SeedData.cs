using backend.Models;
using Microsoft.EntityFrameworkCore;
using SP = backend.Models.ServiceProvider;

namespace backend.Data;

public static class SeedData
{
    public static void Initialize(IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        context.Database.Migrate();

        // Only seed demo data if it doesn't already exist.
        // This check prevents wiping real user data on every restart.
        if (context.Users.Any(u => u.Email == "meron@example.com")) return;

        // ──────────────────────────────────────────────
        // CUSTOMERS (regular users who book services)
        // ──────────────────────────────────────────────
        var customers = new List<User>
        {
            new() { Name = "Meron Tadesse",    Email = "meron@example.com",   Password = BCrypt.Net.BCrypt.HashPassword("password123"), Role = "Customer" },
            new() { Name = "Yonas Bekele",     Email = "yonas@example.com",   Password = BCrypt.Net.BCrypt.HashPassword("password123"), Role = "Customer" },
            new() { Name = "Hana Girma",       Email = "hana@example.com",    Password = BCrypt.Net.BCrypt.HashPassword("password123"), Role = "Customer" },
            new() { Name = "Dawit Alemu",      Email = "dawit@example.com",   Password = BCrypt.Net.BCrypt.HashPassword("password123"), Role = "Customer" },
            new() { Name = "Selam Worku",      Email = "selam@example.com",   Password = BCrypt.Net.BCrypt.HashPassword("password123"), Role = "Customer" },
        };
        context.Users.AddRange(customers);

        // ──────────────────────────────────────────────
        // PROVIDER USERS
        // ──────────────────────────────────────────────
        var providerUsers = new List<User>
        {
            new() { Name = "Abebe Chala",      Email = "abebe.chala@example.com",   Password = BCrypt.Net.BCrypt.HashPassword("password123"), Role = "Provider" },
            new() { Name = "Tigist Haile",     Email = "tigist.haile@example.com",  Password = BCrypt.Net.BCrypt.HashPassword("password123"), Role = "Provider" },
            new() { Name = "Mulugeta Fikadu",  Email = "mulugeta.f@example.com",    Password = BCrypt.Net.BCrypt.HashPassword("password123"), Role = "Provider" },
            new() { Name = "Almaz Tesfaye",    Email = "almaz.t@example.com",       Password = BCrypt.Net.BCrypt.HashPassword("password123"), Role = "Provider" },
            new() { Name = "Bereket Negash",   Email = "bereket.n@example.com",     Password = BCrypt.Net.BCrypt.HashPassword("password123"), Role = "Provider" },
            new() { Name = "Selamawit Assefa", Email = "selama.a@example.com",      Password = BCrypt.Net.BCrypt.HashPassword("password123"), Role = "Provider" },
            new() { Name = "Henok Tesfaw",     Email = "henok.t@example.com",       Password = BCrypt.Net.BCrypt.HashPassword("password123"), Role = "Provider" },
            new() { Name = "Rahel Mekonnen",   Email = "rahel.m@example.com",       Password = BCrypt.Net.BCrypt.HashPassword("password123"), Role = "Provider" },
        };
        context.Users.AddRange(providerUsers);
        context.SaveChanges();

        // ──────────────────────────────────────────────
        // SERVICE PROVIDERS
        // ──────────────────────────────────────────────
        var providers = new List<SP>
        {
            new SP
            {
                UserId = providerUsers[0].Id,
                Bio = "ሰላም! My name is Abebe and I have been fixing electrical problems for over 12 years. I work quickly, safely, and always clean up after myself. Call me anytime — no job is too small.",
                Location = "Addis Ababa, Bole",
                Phone = "+251 911 234 567",
                ProfileImage = "https://ui-avatars.com/api/?name=Abebe+Chala&background=6C63FF&color=fff&bold=true&size=128",
            },
            new SP
            {
                UserId = providerUsers[1].Id,
                Bio = "ሃይሌ! Experienced plumber serving Addis Ababa for 9 years. I fix leaks, install pipes, and repair bathrooms fast. Your water problems are solved today, not tomorrow.",
                Location = "Addis Ababa, Piassa",
                Phone = "+251 922 345 678",
                ProfileImage = "https://ui-avatars.com/api/?name=Tigist+Haile&background=A259FF&color=fff&bold=true&size=128",
            },
            new SP
            {
                UserId = providerUsers[2].Id,
                Bio = "Professional house painter based in Bahir Dar. ቤትዎን አዲስ ይምሰሉ — let your home look brand new! Interior and exterior painting with quality materials. Free estimate on request.",
                Location = "Bahir Dar, Kebele 3",
                Phone = "+251 933 456 789",
                ProfileImage = "https://ui-avatars.com/api/?name=Mulugeta+Fikadu&background=22d3ee&color=fff&bold=true&size=128",
            },
            new SP
            {
                UserId = providerUsers[3].Id,
                Bio = "ሰላም! I run a trusted home cleaning team in Hawassa. We use eco-friendly products, arrive on time, and treat your home with respect. Perfect for weekly or one-time deep cleans.",
                Location = "Hawassa, Tabor",
                Phone = "+251 944 567 890",
                ProfileImage = "https://ui-avatars.com/api/?name=Almaz+Tesfaye&background=10b981&color=fff&bold=true&size=128",
            },
            new SP
            {
                UserId = providerUsers[4].Id,
                Bio = "Certified auto mechanic with 15 years of experience in Mekelle. ብዙ ዘመን ልምድ አለኝ — I diagnose and repair all car brands. Engine, brakes, suspension — I handle everything honestly and affordably.",
                Location = "Mekelle, Ayder",
                Phone = "+251 955 678 901",
                ProfileImage = "https://ui-avatars.com/api/?name=Bereket+Negash&background=f59e0b&color=fff&bold=true&size=128",
            },
            new SP
            {
                UserId = providerUsers[5].Id,
                Bio = "ሠላም! I am a skilled carpenter in Dire Dawa. I make custom furniture, fix doors, and build cabinets to your exact taste. Quality wood, beautiful finish, fair price.",
                Location = "Dire Dawa, Sabian",
                Phone = "+251 966 789 012",
                ProfileImage = "https://ui-avatars.com/api/?name=Selamawit+Assefa&background=ec4899&color=fff&bold=true&size=128",
            },
            new SP
            {
                UserId = providerUsers[6].Id,
                Bio = "Private tutor for Mathematics, Physics, and English — helping students in Jimma pass their exams since 2015. ትምህርት ቤት ከባድ ነው? We make it easy and fun. Home visits available.",
                Location = "Jimma, Merkato",
                Phone = "+251 977 890 123",
                ProfileImage = "https://ui-avatars.com/api/?name=Henok+Tesfaw&background=6C63FF&color=fff&bold=true&size=128",
            },
            new SP
            {
                UserId = providerUsers[7].Id,
                Bio = "ሰላም! Professional hair and beauty specialist in Adama. I do braids, hairstyles, facials, and makeup. ቆንጆ ሁኑ — look and feel your best for any occasion. Home service available.",
                Location = "Adama, Wonji Road",
                Phone = "+251 988 901 234",
                ProfileImage = "https://ui-avatars.com/api/?name=Rahel+Mekonnen&background=f43f5e&color=fff&bold=true&size=128",
            },
        };
        context.ServiceProviders.AddRange(providers);
        context.SaveChanges();

        // ──────────────────────────────────────────────
        // SERVICES (each provider has 2–3)
        // ──────────────────────────────────────────────
        var services = new List<Service>
        {
            // Abebe – Electrical
            new() { ProviderId = providers[0].Id, Title = "Home Wiring & Rewiring",      Category = "Electrical",    Description = "Full home wiring, circuit breaker installation, and safety checks. We ensure your home meets all safety standards." },
            new() { ProviderId = providers[0].Id, Title = "Generator Installation",       Category = "Electrical",    Description = "Supply and install backup generators for homes and small businesses. Never lose power again." },
            new() { ProviderId = providers[0].Id, Title = "Solar Panel Setup",            Category = "Electrical",    Description = "Affordable solar panel installation for homes. Save on electricity and help the environment." },

            // Tigist – Plumbing
            new() { ProviderId = providers[1].Id, Title = "Leak Repair & Detection",      Category = "Plumbing",      Description = "Quick leak detection and repair service. We find the problem fast so water damage stays minimal." },
            new() { ProviderId = providers[1].Id, Title = "Bathroom Installation",        Category = "Plumbing",      Description = "Full bathroom fitting — toilet, sink, shower, and pipes. Done neatly and professionally." },

            // Mulugeta – Painting
            new() { ProviderId = providers[2].Id, Title = "Interior House Painting",      Category = "Painting",      Description = "Transform your rooms with fresh, vibrant colors. We prepare surfaces properly before painting for a long-lasting finish." },
            new() { ProviderId = providers[2].Id, Title = "Exterior Wall Painting",       Category = "Painting",      Description = "Weather-resistant exterior painting that protects your walls and makes your home stand out." },
            new() { ProviderId = providers[2].Id, Title = "Decorative Finishes",          Category = "Painting",      Description = "Textured walls, stencil designs, and artistic finishes to give your space a unique look." },

            // Almaz – Cleaning
            new() { ProviderId = providers[3].Id, Title = "Deep Home Cleaning",           Category = "Cleaning",      Description = "Full top-to-bottom cleaning of your entire home. Kitchens, bathrooms, bedrooms — everything sparkling clean." },
            new() { ProviderId = providers[3].Id, Title = "Weekly House Maintenance",     Category = "Cleaning",      Description = "Recurring weekly cleaning service so your home is always fresh without you lifting a finger." },

            // Bereket – Car Repair
            new() { ProviderId = providers[4].Id, Title = "Engine Diagnostics & Repair",  Category = "Car Repair",    Description = "Using modern diagnostic tools to find and fix engine problems fast. All car brands welcome." },
            new() { ProviderId = providers[4].Id, Title = "Brake System Service",         Category = "Car Repair",    Description = "Full brake inspection, pad replacement, and fluid top-up to keep you safe on the road." },
            new() { ProviderId = providers[4].Id, Title = "Oil Change & Tune-Up",         Category = "Car Repair",    Description = "Quick oil change and general tune-up to keep your car running smoothly and efficiently." },

            // Selamawit – Carpentry
            new() { ProviderId = providers[5].Id, Title = "Custom Furniture Making",      Category = "Carpentry",     Description = "Handmade beds, wardrobes, dining tables, and shelves built to your exact measurements and style." },
            new() { ProviderId = providers[5].Id, Title = "Door & Window Repair",         Category = "Carpentry",     Description = "Fix broken doors, stuck windows, and damaged frames quickly. Your home's security matters." },

            // Henok – Tutoring
            new() { ProviderId = providers[6].Id, Title = "Math & Physics Tutoring",      Category = "Tutoring",      Description = "One-on-one sessions for Grade 9–12 students. We focus on understanding, not just memorizing." },
            new() { ProviderId = providers[6].Id, Title = "English Language Coaching",    Category = "Tutoring",      Description = "Improve your spoken and written English for school, work, or travel. Beginner to advanced." },
            new() { ProviderId = providers[6].Id, Title = "University Entrance Prep",     Category = "Tutoring",      Description = "Targeted preparation for Ethiopian university entrance exams. Past papers and practice tests included." },

            // Rahel – Beauty
            new() { ProviderId = providers[7].Id, Title = "Hair Braiding & Styling",      Category = "Beauty & Hair", Description = "All types of braids, twists, and natural hair styling done at your home or our salon." },
            new() { ProviderId = providers[7].Id, Title = "Bridal Makeup & Hair",         Category = "Beauty & Hair", Description = "Look stunning on your wedding day. Full makeup and hair package tailored to your style." },
        };
        context.Services.AddRange(services);
        context.SaveChanges();

        // ──────────────────────────────────────────────
        // BOOKINGS
        // ──────────────────────────────────────────────
        var bookings = new List<Booking>
        {
            new() { CustomerId = customers[0].Id, ServiceId = services[0].Id,  ProviderId = providers[0].Id, Date = DateTime.UtcNow.AddDays(-14), Status = "Completed" },
            new() { CustomerId = customers[1].Id, ServiceId = services[3].Id,  ProviderId = providers[1].Id, Date = DateTime.UtcNow.AddDays(-10), Status = "Completed" },
            new() { CustomerId = customers[2].Id, ServiceId = services[5].Id,  ProviderId = providers[2].Id, Date = DateTime.UtcNow.AddDays(-7),  Status = "Completed" },
            new() { CustomerId = customers[3].Id, ServiceId = services[8].Id,  ProviderId = providers[3].Id, Date = DateTime.UtcNow.AddDays(-5),  Status = "Completed" },
            new() { CustomerId = customers[4].Id, ServiceId = services[10].Id, ProviderId = providers[4].Id, Date = DateTime.UtcNow.AddDays(-3),  Status = "Completed" },
            new() { CustomerId = customers[0].Id, ServiceId = services[13].Id, ProviderId = providers[5].Id, Date = DateTime.UtcNow.AddDays(-2),  Status = "Pending"   },
            new() { CustomerId = customers[1].Id, ServiceId = services[15].Id, ProviderId = providers[6].Id, Date = DateTime.UtcNow.AddDays(3),   Status = "Pending"   },
            new() { CustomerId = customers[2].Id, ServiceId = services[18].Id, ProviderId = providers[7].Id, Date = DateTime.UtcNow.AddDays(7),   Status = "Pending"   },
            new() { CustomerId = customers[3].Id, ServiceId = services[1].Id,  ProviderId = providers[0].Id, Date = DateTime.UtcNow.AddDays(-20), Status = "Completed" },
            new() { CustomerId = customers[4].Id, ServiceId = services[4].Id,  ProviderId = providers[1].Id, Date = DateTime.UtcNow.AddDays(-18), Status = "Completed" },
        };
        context.Bookings.AddRange(bookings);
        context.SaveChanges();

        // ──────────────────────────────────────────────
        // REVIEWS (only for completed bookings)
        // ──────────────────────────────────────────────
        var reviews = new List<Review>
        {
            new() { CustomerId = customers[0].Id, ProviderId = providers[0].Id, BookingId = bookings[0].Id, Rating = 5, Comment = "Abebe did an amazing job! He fixed all the wiring in our house in one day. Very professional and clean. አመሰግናለሁ!" },
            new() { CustomerId = customers[1].Id, ProviderId = providers[1].Id, BookingId = bookings[1].Id, Rating = 5, Comment = "Tigist found the leak immediately and fixed it within an hour. No mess left behind. Highly recommend!" },
            new() { CustomerId = customers[2].Id, ProviderId = providers[2].Id, BookingId = bookings[2].Id, Rating = 4, Comment = "Mulugeta painted our entire living room beautifully. The colors look exactly as we wanted. Very happy with the result." },
            new() { CustomerId = customers[3].Id, ProviderId = providers[3].Id, BookingId = bookings[3].Id, Rating = 5, Comment = "Almaz and her team cleaned our house from top to bottom. Everything is spotless. We will definitely book again. ደስ ይላል!" },
            new() { CustomerId = customers[4].Id, ProviderId = providers[4].Id, BookingId = bookings[4].Id, Rating = 5, Comment = "Bereket diagnosed the engine problem in 20 minutes and fixed it the same day. Fair price and very honest. እናመሰግናለን!" },
            new() { CustomerId = customers[3].Id, ProviderId = providers[0].Id, BookingId = bookings[8].Id, Rating = 5, Comment = "Second time working with Abebe. He installed our generator perfectly. Always on time and trustworthy." },
            new() { CustomerId = customers[4].Id, ProviderId = providers[1].Id, BookingId = bookings[9].Id, Rating = 4, Comment = "Good plumbing work. Bathroom installation done neatly. Took a bit longer than expected but quality is excellent." },
        };
        context.Reviews.AddRange(reviews);
        context.SaveChanges();
    }
}
