# Atlassian Marketplace Publishing Guide

This guide walks through publishing the PlantUML Confluence Cloud app to the Atlassian Marketplace.

## Prerequisites

- Completed app development and testing
- Atlassian Developer account
- App icons and marketing materials
- Legal review of terms and privacy policy

## 1. Atlassian Developer Account Setup

### Create Developer Account
1. Go to [developer.atlassian.com](https://developer.atlassian.com)
2. Sign up or log in with your Atlassian account
3. Complete developer profile with:
   - Company information
   - Contact details
   - Tax information (for paid apps)

### Verify Account
- Email verification required
- Phone verification for paid apps
- Business verification for enterprise features

## 2. App Registration

### Create App Listing
1. Navigate to "Your apps" → "Create app"
2. Choose "Forge app" as the platform
3. Fill in basic information:
   - **App name**: PlantUML for Confluence
   - **App key**: plantuml-confluence
   - **Description**: Create and edit PlantUML diagrams directly in Confluence pages

### App Categories
Select appropriate categories:
- **Primary**: Diagrams & Flowcharts
- **Secondary**: Documentation, Productivity

## 3. App Descriptor Completion

### Basic Information
```yaml
name: PlantUML for Confluence
summary: Create beautiful UML diagrams with live editing and preview
description: |
  Transform your Confluence pages with professional UML diagrams. 
  PlantUML for Confluence provides a powerful editor with syntax highlighting, 
  live preview, and seamless integration with Confluence Cloud.
  
  Features:
  - Monaco editor with PlantUML syntax highlighting
  - Live preview with debounced rendering
  - Support for SVG and PNG formats
  - Multiple themes (default, plain, monochrome, bluegray)
  - Keyboard shortcuts (Ctrl/Cmd+Enter to render)
  - Responsive design for all screen sizes
  - Hash-based caching for performance
  - Enterprise-grade security with JWT authentication

vendor:
  name: Your Company Name
  url: https://yourcompany.com
  supportUrl: https://yourcompany.com/support
```

### Pricing Model
Choose pricing strategy:
- **Free**: Recommended for initial launch
- **Paid**: Monthly/annual subscription
- **Freemium**: Free tier + paid features

Example pricing tiers:
```
Free Tier:
- Up to 10 diagrams per page
- Basic themes
- Community support

Pro Tier ($5/month):
- Unlimited diagrams
- All themes and formats
- Priority support
- Advanced features

Enterprise Tier ($15/month):
- Everything in Pro
- Custom renderer deployment
- SLA support
- Advanced security features
```

### App Icons
Required icon sizes:
- **16x16**: Favicon
- **32x32**: App listing thumbnail
- **128x128**: App details page
- **256x256**: High-resolution display

Icon requirements:
- PNG format with transparency
- Professional design matching Atlassian style
- PlantUML/diagram theme
- Consistent branding across sizes

## 4. Permissions & Scopes

### Required Scopes
Document all Forge permissions:

```yaml
permissions:
  scopes:
    - read:confluence-content.summary
      reason: "Read page metadata for macro context"
    - write:confluence-content
      reason: "Insert and update PlantUML macros"
    - read:confluence-space
      reason: "Access space information for macro rendering"
    - storage:app
      reason: "Cache rendered diagrams for performance"
  external:
    fetch:
      backend:
        - '*.amazonaws.com'
          reason: "Connect to PlantUML rendering service"
```

### Data Security Declaration
```yaml
dataResidency:
  - region: "AWS regions (configurable)"
  - description: "Diagram rendering occurs in specified AWS region"

dataRetention:
  - type: "Rendered diagrams"
  - duration: "Cached until eviction (performance only)"
  - type: "PlantUML source"
  - duration: "0 seconds (not persisted)"

dataProcessing:
  - personalData: false
  - description: "Only processes diagram source code, no personal information"
```

## 5. App Documentation

### User Documentation
Create comprehensive help documentation:

#### Getting Started Guide
1. **Installation**
   - How to install from Marketplace
   - Permission approval process
   - Initial configuration

2. **Basic Usage**
   - Adding PlantUML macro to pages
   - Using the editor interface
   - Rendering diagrams

3. **Advanced Features**
   - Format options (SVG vs PNG)
   - Theme selection
   - Dimension controls
   - Keyboard shortcuts

#### PlantUML Syntax Guide
- Link to official PlantUML documentation
- Common diagram types with examples
- Syntax highlighting features
- Error troubleshooting

#### Administrator Guide
- App configuration in Confluence
- Renderer URL configuration
- Security considerations
- Performance optimization

### Developer Documentation
- API reference (if applicable)
- Webhook documentation
- Integration examples
- Troubleshooting guide

## 6. Security & Privacy

### Privacy Policy
Required sections:
```markdown
# Privacy Policy

## Data Collection
- We do not collect personal information
- Diagram source code is processed in memory only
- No user data is stored or transmitted to third parties

## Data Processing
- PlantUML source code is sent to rendering service
- Rendered diagrams are cached for performance
- All data transmission is encrypted (HTTPS/TLS)

## Data Retention
- Source code: Not retained (0 seconds)
- Rendered diagrams: Cached until eviction
- Logs: Error logs only, 14-day retention

## Third-Party Services
- AWS Lambda: Diagram rendering
- AWS CloudWatch: Error monitoring
- No data shared with other third parties

## Contact Information
- Email: privacy@yourcompany.com
- Address: Your Company Address
```

### Security Documentation
- Data flow diagrams
- Encryption standards
- Authentication mechanisms
- Vulnerability disclosure policy

## 7. Testing & Quality Assurance

### Pre-Submission Testing
- [ ] Install app in test Confluence instance
- [ ] Test all macro parameters
- [ ] Verify editor functionality
- [ ] Test different diagram types
- [ ] Performance testing with large diagrams
- [ ] Mobile responsiveness testing
- [ ] Browser compatibility testing

### Security Testing
- [ ] Input validation testing
- [ ] XSS prevention verification
- [ ] Authentication bypass testing
- [ ] Rate limiting verification
- [ ] CORS configuration testing

### Accessibility Testing
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast compliance
- [ ] ARIA labels verification

## 8. Submission Process

### Pre-Submission Checklist
- [ ] App functionality complete and tested
- [ ] All required icons uploaded
- [ ] Privacy policy and terms of service
- [ ] Support documentation complete
- [ ] Pricing model configured
- [ ] Security review completed

### Submission Steps
1. **Submit for Review**
   - Click "Submit for review" in developer console
   - Provide detailed release notes
   - Include testing instructions for reviewers

2. **Review Process**
   - Automated security scanning
   - Manual functionality review
   - Privacy policy compliance check
   - Performance testing

3. **Common Review Issues**
   - Insufficient error handling
   - Missing accessibility features
   - Unclear permission justifications
   - Incomplete documentation

### Review Timeline
- **Initial Review**: 5-10 business days
- **Resubmission**: 3-5 business days
- **Security Review**: Additional 2-3 days for complex apps

## 9. Post-Approval Process

### Release Strategy
1. **Soft Launch**
   - Release to limited audience
   - Monitor for issues
   - Gather initial feedback

2. **Staged Rollout**
   - Gradual availability increase
   - Monitor performance metrics
   - Address any scaling issues

3. **Full Release**
   - Public availability
   - Marketing campaign launch
   - Community engagement

### Marketing Materials
- App store screenshots
- Feature highlight videos
- Blog post announcement
- Social media content
- Press release (if applicable)

## 10. Ongoing Maintenance

### Version Management
- Semantic versioning (1.0.0, 1.1.0, 2.0.0)
- Release notes for each version
- Backward compatibility considerations
- Migration guides for breaking changes

### Support Process
- Support ticket system setup
- Response time commitments
- Escalation procedures
- Knowledge base maintenance

### Monitoring & Analytics
- App usage metrics
- Performance monitoring
- Error rate tracking
- User feedback collection

### Update Process
1. **Development**
   - Feature development
   - Testing and QA
   - Security review

2. **Submission**
   - Update submission to Marketplace
   - Review process
   - Approval and release

3. **Deployment**
   - Staged rollout
   - Monitoring
   - Issue resolution

## 11. Compliance & Legal

### Terms of Service
Required legal terms:
- Service availability
- User responsibilities
- Limitation of liability
- Termination conditions
- Governing law

### GDPR Compliance
- Data processing lawful basis
- User consent mechanisms
- Data subject rights
- Data protection officer contact

### Export Control
- Encryption technology disclosure
- Export administration regulations
- International usage restrictions

## 12. Success Metrics

### Key Performance Indicators
- **Adoption**: Installation rate, active users
- **Engagement**: Diagrams created, editor usage
- **Quality**: User ratings, support tickets
- **Performance**: Response times, error rates

### Monitoring Tools
- Atlassian Analytics dashboard
- Custom metrics collection
- User feedback surveys
- Support ticket analysis

---

**Estimated Timeline**: 4-6 weeks from submission to public availability  
**Success Criteria**: 4+ star rating, <5% support ticket rate, positive user feedback