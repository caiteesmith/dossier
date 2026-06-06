using Dossier.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Dossier.Api.Data;

public class DossierDbContext(DbContextOptions<DossierDbContext> options) : DbContext(options)
{
    public DbSet<Photographer>           Photographers          { get; set; }
    public DbSet<Lead>                   Leads                  { get; set; }
    public DbSet<Booking>                Bookings               { get; set; }
    public DbSet<Task_>                  Tasks                  { get; set; }
    public DbSet<Vendor>                 Vendors                { get; set; }
    public DbSet<Timeline>               Timelines              { get; set; }
    public DbSet<TimelineBlock>          TimelineBlocks         { get; set; }
    public DbSet<ShotList>               ShotLists              { get; set; }
    public DbSet<ShotListGroup>          ShotListGroups         { get; set; }
    public DbSet<ShotListItem>           ShotListItems          { get; set; }
    public DbSet<PackageTemplate>        PackageTemplates       { get; set; }
    public DbSet<QuestionnaireResponse>  QuestionnaireResponses { get; set; }

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<Photographer>().ToTable("photographers");
        mb.Entity<Lead>().ToTable("leads");
        mb.Entity<Booking>().ToTable("bookings");
        mb.Entity<Task_>().ToTable("tasks");
        mb.Entity<Vendor>().ToTable("vendors");
        mb.Entity<Timeline>().ToTable("timelines");
        mb.Entity<TimelineBlock>().ToTable("timeline_blocks");
        mb.Entity<ShotList>().ToTable("shot_lists");
        mb.Entity<ShotListGroup>().ToTable("shot_list_groups");
        mb.Entity<ShotListItem>().ToTable("shot_list_items");
        mb.Entity<PackageTemplate>().ToTable("package_templates");
        mb.Entity<QuestionnaireResponse>().ToTable("questionnaire_responses");

        // Array column for package includes
        mb.Entity<PackageTemplate>()
            .Property(p => p.Includes)
            .HasColumnType("text[]");

        // Navigation: Timeline -> Blocks
        mb.Entity<Timeline>()
            .HasMany(t => t.Blocks)
            .WithOne()
            .HasForeignKey(b => b.TimelineId);

        // Navigation: ShotList -> Groups -> Items
        mb.Entity<ShotList>()
            .HasMany(s => s.Groups)
            .WithOne()
            .HasForeignKey(g => g.ShotListId);

        mb.Entity<ShotListGroup>()
            .HasMany(g => g.Items)
            .WithOne()
            .HasForeignKey(i => i.GroupId);
            
        mb.Entity<Booking>()
            .Property(b => b.Status)
            .HasConversion<string>();

        mb.Entity<Lead>()
            .Property(l => l.Status)
            .HasConversion<string>();

        mb.Entity<Task_>()
            .Property(t => t.Category)
            .HasConversion<string>();
            
        mb.Entity<Lead>()
        .Property(l => l.Source)
        .HasConversion<string>();
    }
}