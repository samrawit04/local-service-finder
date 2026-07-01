namespace backend.DTOs;

public record JobPostDto(
    string Title,
    string Description,
    string Category,
    string Budget,
    string Location
);

public record JobApplicationDto(
    string CoverNote
);
