---
name: systematic-documentation-cleanup
description: Use when completing major features, migrations, or rebrandings to systematically update all documentation, archive obsolete files, ensure naming consistency, update dates, and commit professionally
---

# Systematic Documentation Cleanup

Use this skill after completing major work to ensure all documentation is accurate, consistent, and professional.

## When to Use This Skill

- ✅ After completing a major feature implementation
- ✅ After migrating to a new system (e.g., JWT → Better Auth)
- ✅ After rebranding (e.g., "MyPak Connect" → "MyPak - Kavop")
- ✅ When project status changes significantly
- ✅ Before major releases or demos
- ✅ When onboarding new team members and docs feel stale

## DO NOT Use This Skill When

- ❌ Making small single-file documentation updates
- ❌ Fixing typos or minor corrections
- ❌ Adding documentation for new feature (not replacing old system)

## Mandatory Checklist

You MUST create TodoWrite todos for each of these items:

### Phase 1: Discovery

**Todo: "Identify all documentation files to review"**

1. List all documentation files in the project
2. Create a comprehensive inventory:
   ```bash
   find . -type f \( -name "*.md" -o -name "CLAUDE.md" -o -name "README*" \) | grep -v node_modules
   ```
3. Categorize by type:
   - User-facing (README, onboarding)
   - Developer-facing (CLAUDE.md, architecture docs)
   - Planning (specs, design docs)
   - Reference (API docs, database schemas)

### Phase 2: Find Old References

**Todo: "Search for outdated terminology and references"**

1. Identify what changed (old system → new system)
2. Search for ALL occurrences:
   ```bash
   # Example: Finding old auth references
   grep -r "JWT" docs/
   grep -r "Old System Name" .
   ```
3. Document every file that needs updating
4. Check for:
   - Old system names
   - Old branding/product names
   - Outdated architecture diagrams
   - References to removed features
   - Links to archived/moved files

### Phase 3: Update Core Documentation

**Todo: "Update CLAUDE.md with new system"**

1. Add comprehensive section for new system
2. Document:
   - What changed and why
   - How the new system works
   - Key configuration/setup
   - Testing instructions
   - Common patterns
3. Remove or update old system references

**Todo: "Update README.md"**

1. Update project description
2. Update setup instructions
3. Update branding/naming
4. Update commands if changed
5. Verify all links work

**Todo: "Update PROJECT-STATUS.md or equivalent"**

1. Update version number
2. Update "Last Updated" date
3. Update implementation status for completed features
4. Update current status section
5. Update documentation status section
6. Add newly archived docs to archived section

### Phase 4: Update Technical Documentation

**Todo: "Update database/schema documentation"**

1. If database changed: completely rewrite schema docs
2. Add new tables/fields
3. Mark deprecated fields with DEPRECATED comments
4. Update data flow diagrams
5. Update migration strategy

**Todo: "Update architecture documentation"**

1. Update architecture diagrams
2. Update data flow descriptions
3. Update key decisions section
4. Add new system to tech stack

**Todo: "Update developer onboarding docs"**

1. Update "What is [Project]?" section with correct naming
2. Update "Current Status" section
3. Update architecture diagram
4. Update setup instructions (environment variables, etc.)
5. Update seed data instructions
6. Update authentication flow documentation
7. Update project structure tree
8. Update "Where to find things" reference tables
9. Update troubleshooting section
10. Update all dates

### Phase 5: Archive Obsolete Documentation

**Todo: "Archive outdated documentation files"**

1. Identify docs that are now obsolete
2. Create archive directory structure:
   ```
   docs/archive/
   └── [category]/
       └── [filename]-OBSOLETE.md
   ```
3. Move (don't delete) obsolete files:
   ```bash
   git mv old-doc.md archive/old-doc-OBSOLETE.md
   ```
4. Update any references to archived docs

**Todo: "Archive completed implementation plans"**

1. Move completed plans to `docs/plans/archive/`
2. Add completion date to filename if not already there
3. Update plan index or README if it exists

### Phase 6: Verify Consistency

**Todo: "Verify branding consistency across all docs"**

1. Search for old product/system names
2. Verify consistent capitalization
3. Verify consistent terminology
4. Check dates are current where relevant

**Todo: "Verify all internal links work"**

1. Check all `[text](path)` links
2. Update paths for moved/renamed files
3. Verify relative paths are correct

**Todo: "Update all 'Last Updated' dates"**

1. Search for "Last Updated" in all docs
2. Update to current date (YYYY-MM-DD format)
3. Ensure dates match the actual content update

### Phase 7: Final Review

**Todo: "Read through all updated docs as fresh eyes"**

1. Read each updated doc start to finish
2. Check for:
   - Consistency in tone
   - No contradictions between docs
   - No broken formatting
   - No leftover old references
3. Fix any issues found

### Phase 8: Commit

**Todo: "Commit documentation cleanup with comprehensive message"**

1. Stage all modified files:
   ```bash
   git add [files]
   ```

2. Create comprehensive commit message using this template:
   ```
   docs: [short description of cleanup]

   [Detailed description of what changed and why]

   ## Files Updated

   ### [File 1]
   - [Change 1]
   - [Change 2]

   ### [File 2]
   - [Change 1]

   ## Files Archived

   ### [File 3]
   - [Why archived]

   ## Summary

   All documentation now accurately reflects:
   - [Key change 1]
   - [Key change 2]
   - [Key change 3]

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   ```

3. Commit with the message
4. Verify clean working tree

## Quality Standards

### Completeness
- ✅ Every doc file reviewed
- ✅ No references to old system remain (unless intentionally documented as "previously")
- ✅ All dates updated
- ✅ All links verified

### Consistency
- ✅ Same branding/naming throughout
- ✅ Same terminology for concepts
- ✅ Same formatting conventions
- ✅ Same date format

### Professional Polish
- ✅ No typos
- ✅ Clear, concise language
- ✅ Proper Markdown formatting
- ✅ Comprehensive commit message

## Common Pitfalls to Avoid

1. **Skipping the search phase**: Always search for ALL occurrences of old terminology
2. **Forgetting diagrams**: ASCII/text diagrams need updates too
3. **Leaving broken links**: Check every `[text](path)` link
4. **Incomplete dates**: Search for "Last Updated", "Version", "As of", etc.
5. **Forgetting examples**: Code examples and command examples need updates
6. **Not archiving**: Move obsolete docs to archive, don't delete
7. **Vague commit messages**: Be specific about what changed and why
8. **Batch updating without TodoWrite**: Each phase needs a todo for tracking

## Anti-Patterns

**DON'T:**
- Update files in random order without a checklist
- Skip creating TodoWrite todos "to save time"
- Delete obsolete docs instead of archiving
- Use vague commit messages like "update docs"
- Stop at just CLAUDE.md and README
- Forget to update dates
- Leave half-updated docs (all or nothing per file)

**DO:**
- Follow the checklist systematically
- Create TodoWrite todos for visibility
- Archive with clear naming (-OBSOLETE suffix)
- Write comprehensive commit messages
- Update ALL relevant docs
- Update all dates to current
- Complete each file fully before moving on

## Success Criteria

When done, you should be able to:
- ✅ Onboard a new developer using the docs without confusion
- ✅ Search for old system name and find zero results (except in archive)
- ✅ Have every doc dated within the last week
- ✅ Have a comprehensive commit showing what was updated
- ✅ Have all obsolete docs clearly archived
- ✅ Answer "when was this doc last reviewed?" with confidence

## Example Session

```
User: "We just migrated from JWT to Better Auth. Clean up the docs."

Assistant: "I'm using the systematic-documentation-cleanup skill to update all docs for the Better Auth migration."

<Uses Skill tool to run systematic-documentation-cleanup>

Assistant creates TodoWrite todos:
1. Identify all documentation files to review
2. Search for outdated terminology and references
3. Update CLAUDE.md with new system
4. Update README.md
5. Update PROJECT-STATUS.md or equivalent
6. Update database/schema documentation
7. Update architecture documentation
8. Update developer onboarding docs
9. Archive outdated documentation files
10. Archive completed implementation plans
11. Verify branding consistency across all docs
12. Verify all internal links work
13. Update all 'Last Updated' dates
14. Read through all updated docs as fresh eyes
15. Commit documentation cleanup with comprehensive message

Assistant then systematically works through each todo, updating:
- CLAUDE.md (added Better Auth section)
- DATABASE-MODELS.md (complete rewrite with Better Auth tables)
- PROJECT-STATUS.md (updated status, dates)
- developer-onboarding.md (updated branding, auth flow, setup)
- Archived: AUTHENTICATION-JWT-OLD.md
- Archived: 2025-11-14-better-auth-clean-slate.md (completed plan)

Final commit:
  docs: comprehensive documentation cleanup for Better Auth
  
  [Comprehensive multi-section commit message]
  
  6 files changed, +554, -265 lines
```

## Remember

**This is a SYSTEMATIC process, not a quick update.**

If you find yourself thinking "I'll just update the README quickly" - STOP. Use this skill.

If you find yourself skipping TodoWrite - STOP. Use this skill properly.

If you find yourself with a vague commit message - STOP. Follow the template.

**The 30 minutes you spend being systematic saves hours of confusion later.**
