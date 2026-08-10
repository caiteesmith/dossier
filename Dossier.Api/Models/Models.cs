using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Dossier.Api.Models;

// ── Enums ────────────────────────────────────────────────────────

public enum LeadStatus    { New, Contacted, ProposalSent, Negotiating, Booked, Lost }
public enum LeadSource    { Website, Instagram, ReferralVendor, ReferralClient, Google, WeddingWire, TheKnot, Other }
public enum BookingStatus { Pending, Confirmed, Booked, Completed, Cancelled }
public enum TaskCategory  { Admin, Client, DayOf, PostWedding, Manual }

// ── Photographer ─────────────────────────────────────────────────

public class Photographer
{
    [Key, Column("id")]              public Guid    Id           { get; set; }
    [Column("first_name")]            public string  FirstName     { get; set; } = "";
    [Column("last_name")]            public string  LastName     { get; set; } = "";
    [Column("email")]                public string  Email        { get; set; } = "";
    [Column("business_name")]        public string? BusinessName { get; set; }
    [Column("phone")]                public string? Phone        { get; set; }
    [Column("logo_url")]             public string? LogoUrl      { get; set; }
    [Column("website")]              public string? Website      { get; set; }
    [Column("instagram")]            public string? Instagram    { get; set; }
    [Column("calendly_url")]         public string? CalendlyUrl  { get; set; }
    [Column("timezone")]             public string  Timezone     { get; set; } = "America/New_York";
    [Column("business_address")]     public string? BusinessAddress { get; set; }
    [Column("portal_signoff")]       public string? PortalSignoff   { get; set; }
    [Column("gallery_delivery_weeks")] public int GalleryDeliveryWeeks { get; set; } = 6;
    [Column("gallery_delivery_weeks_max")] public int GalleryDeliveryWeeksMax { get; set; } = 8;
    [Column("headshot_url")] public string? HeadshotUrl { get; set; }

    [Column("created_at")]           public DateTime CreatedAt   { get; set; }
    [Column("updated_at")]           public DateTime UpdatedAt   { get; set; }
}

// ── Lead ─────────────────────────────────────────────────────────

public class Lead
{
    [Key, Column("id")]              public Guid         Id            { get; set; }
    [Column("photographer_id")]      public Guid         PhotographerId { get; set; }
    [Column("first_name")]           public string       FirstName     { get; set; } = "";
    [Column("last_name")]            public string       LastName      { get; set; } = "";
    [Column("partner_name")]         public string?      PartnerName   { get; set; }
    [Column("email")]                public string       Email         { get; set; } = "";
    [Column("phone")]                public string?      Phone         { get; set; }
    [Column("wedding_date")]         public DateOnly?    WeddingDate   { get; set; }
    [Column("venue_name")]           public string?      VenueName     { get; set; }
    [Column("venue_location")]       public string?      VenueLocation { get; set; }
    [Column("status")]               public LeadStatus   Status        { get; set; } = LeadStatus.New;
    [Column("source")]               public LeadSource?  Source        { get; set; }
    [Column("referral_name")]        public string?      ReferralName  { get; set; }
    [Column("budget")]               public decimal?     Budget        { get; set; }
    [Column("notes")]                public string?      Notes         { get; set; }
    [Column("inquiry_date")]         public DateOnly     InquiryDate   { get; set; }
    [Column("follow_up_at")]         public DateTime?    FollowUpAt    { get; set; }
    [Column("created_at")]           public DateTime     CreatedAt     { get; set; }
    [Column("updated_at")]           public DateTime     UpdatedAt     { get; set; }
}

// ── Booking ───────────────────────────────────────────────────────

public class Booking
{
    [Key, Column("id")]                  public Guid          Id                 { get; set; }
    [Column("photographer_id")]          public Guid          PhotographerId      { get; set; }
    [Column("lead_id")]                  public Guid?         LeadId             { get; set; }
    [Column("partner_one_name")]         public string        PartnerOneName     { get; set; } = "";
    [Column("partner_two_name")]         public string        PartnerTwoName     { get; set; } = "";
    [Column("partner_one_legal_name")]   public string?       PartnerOneLegalName { get; set; }
    [Column("partner_two_legal_name")]   public string?       PartnerTwoLegalName { get; set; }
    [Column("married_surname")]          public string?       MarriedSurname     { get; set; }
    [Column("email")]                    public string        Email              { get; set; } = "";
    [Column("phone")]                    public string?       Phone              { get; set; }
    [Column("mailing_address")]          public string?       MailingAddress     { get; set; }
    [Column("mailing_city")]             public string?       MailingCity        { get; set; }
    [Column("mailing_state")]            public string?       MailingState       { get; set; }
    [Column("mailing_zip")]              public string?       MailingZip         { get; set; }
    [Column("wedding_date")]             public DateOnly      WeddingDate        { get; set; }
    [Column("venue_name")]               public string        VenueName          { get; set; } = "";
    [Column("venue_address")]            public string?       VenueAddress       { get; set; }
    [Column("venue_lat")]                public decimal?      VenueLat           { get; set; }
    [Column("venue_lng")]                public decimal?      VenueLng           { get; set; }
    [Column("package_name")]             public string?       PackageName        { get; set; }
    [Column("package_price")]            public decimal?      PackagePrice       { get; set; }
    [Column("hours_covered")]            public decimal?      HoursCovered       { get; set; }
    [Column("status")]                   public BookingStatus Status             { get; set; } = BookingStatus.Pending;
    [Column("portal_token")]             public Guid          PortalToken        { get; set; }
    [Column("portal_enabled")]           public bool          PortalEnabled      { get; set; }
    [Column("notes")]                    public string?       Notes              { get; set; }
    [Column("gallery_stage_index")]                    public int    GalleryStageIndex { get; set; } = 0;
    [Column("gallery_stages", TypeName = "jsonb")]     public string GalleryStages     { get; set; } = "[\"Backup complete\",\"Sneak peek delivered\",\"Culling in progress\",\"Editing in progress\",\"Final review\",\"Gallery uploaded\"]";
    [Column("workflow_status")]           public string        WorkflowStatus      { get; set; } = "booked";
    [Column("day_of_details", TypeName = "jsonb")] public string DayOfDetails { get; set; } = "{}";
    [Column("add_ons", TypeName = "jsonb")] public string AddOns { get; set; } = "[]";
    [Column("created_at")]               public DateTime      CreatedAt          { get; set; }
    [Column("updated_at")]               public DateTime      UpdatedAt          { get; set; }
    [Column("couple_photo_url")] public string? CouplePhotoUrl { get; set; }
}

// ── Task ──────────────────────────────────────────────────────────

public class Task_
{
    [Key, Column("id")]              public Guid         Id            { get; set; }
    [Column("booking_id")]           public Guid         BookingId     { get; set; }
    [Column("photographer_id")]      public Guid         PhotographerId { get; set; }
    [Column("title")]                public string       Title         { get; set; } = "";
    [Column("category")]             public TaskCategory Category      { get; set; } = TaskCategory.Manual;
    [Column("is_auto")]              public bool         IsAuto        { get; set; }
    [Column("completed")]            public bool         Completed     { get; set; }
    [Column("completed_at")]         public DateTime?    CompletedAt   { get; set; }
    [Column("due_date")]             public DateOnly?    DueDate       { get; set; }
    [Column("sort_order")]           public int          SortOrder     { get; set; }
    [Column("created_at")]           public DateTime     CreatedAt     { get; set; }
    [Column("updated_at")]           public DateTime     UpdatedAt     { get; set; }
}

// ── Vendor ────────────────────────────────────────────────────────

public class Vendor
{
    [Key, Column("id")]              public Guid    Id         { get; set; }
    [Column("booking_id")]           public Guid    BookingId  { get; set; }
    [Column("role")]                 public string  Role       { get; set; } = "";
    [Column("name")]                 public string  Name       { get; set; } = "";
    [Column("phone")]                public string? Phone      { get; set; }
    [Column("email")]                public string? Email      { get; set; }
    [Column("notes")]                public string? Notes      { get; set; }
    [Column("sort_order")]           public int     SortOrder  { get; set; }
    [Column("created_at")]           public DateTime CreatedAt { get; set; }
}

// ── Timeline ──────────────────────────────────────────────────────

public class Timeline
{
    [Key, Column("id")]              public Guid     Id              { get; set; }
    [Column("booking_id")]           public Guid     BookingId       { get; set; }
    [Column("sunset_time")]          public TimeOnly? SunsetTime     { get; set; }
    [Column("golden_hour_time")]     public TimeOnly? GoldenHourTime { get; set; }
    [Column("notes")]                public string?  Notes           { get; set; }
    [Column("created_at")]           public DateTime CreatedAt       { get; set; }
    [Column("updated_at")]           public DateTime UpdatedAt       { get; set; }
    public List<TimelineBlock>       Blocks          { get; set; }   = [];
}

public class TimelineBlock
{
    [Key, Column("id")]              public Guid    Id              { get; set; }
    [Column("timeline_id")]          public Guid    TimelineId      { get; set; }
    [Column("title")]                public string  Title           { get; set; } = "";
    [Column("start_time")]           public TimeOnly StartTime      { get; set; }
    [Column("duration_minutes")]     public int     DurationMinutes { get; set; } = 60;
    [Column("location")]             public string? Location        { get; set; }
    [Column("notes")]                public string? Notes           { get; set; }
    [Column("sort_order")]           public int     SortOrder       { get; set; }
    [Column("created_at")]           public DateTime CreatedAt      { get; set; }
}

// ── Shot list ─────────────────────────────────────────────────────

public class ShotList
{
    [Key, Column("id")]              public Guid    Id        { get; set; }
    [Column("booking_id")]           public Guid    BookingId { get; set; }
    [Column("created_at")]           public DateTime CreatedAt { get; set; }
    [Column("updated_at")]           public DateTime UpdatedAt { get; set; }
    public List<ShotListGroup>       Groups        { get; set; } = [];
}

public class ShotListGroup
{
    [Key, Column("id")]              public Guid    Id          { get; set; }
    [Column("shot_list_id")]         public Guid    ShotListId  { get; set; }
    [Column("name")]                 public string  Name        { get; set; } = "";
    [Column("sort_order")]           public int     SortOrder   { get; set; }
    [Column("created_at")]           public DateTime CreatedAt  { get; set; }
    public List<ShotListItem>        Items         { get; set; } = [];
}

public class ShotListItem
{
    [Key, Column("id")]              public Guid    Id          { get; set; }
    [Column("group_id")]             public Guid    GroupId     { get; set; }
    [Column("description")]          public string  Description { get; set; } = "";
    [Column("notes")]                public string? Notes       { get; set; }
    [Column("completed")]            public bool    Completed   { get; set; }
    [Column("sort_order")]           public int     SortOrder   { get; set; }
    [Column("created_at")]           public DateTime CreatedAt  { get; set; }
}

// ── Package template ──────────────────────────────────────────────

public class PackageTemplate
{
    [Key, Column("id")]              public Guid     Id             { get; set; }
    [Column("photographer_id")]      public Guid     PhotographerId { get; set; }
    [Column("name")]                 public string   Name           { get; set; } = "";
    [Column("description")]          public string?  Description    { get; set; }
    [Column("price")]                public decimal  Price          { get; set; }
    [Column("hours_covered")]        public decimal? HoursCovered   { get; set; }
    [Column("includes")]             public string[] Includes       { get; set; } = [];
    [Column("is_active")]            public bool     IsActive       { get; set; } = true;
    [Column("created_at")]           public DateTime CreatedAt      { get; set; }
    [Column("updated_at")]           public DateTime UpdatedAt      { get; set; }
}

// ── Questionnaire ─────────────────────────────────────────────────

public class QuestionnaireResponse
{
    [Key, Column("id")]              public Guid     Id              { get; set; }
    [Column("booking_id")]           public Guid     BookingId       { get; set; }
    [Column("answers", TypeName = "jsonb")]  public string   Answers  { get; set; } = "{}";
    [Column("submitted_at")]         public DateTime? SubmittedAt    { get; set; }
    [Column("created_at")]           public DateTime CreatedAt       { get; set; }
    [Column("updated_at")]           public DateTime UpdatedAt       { get; set; }
}