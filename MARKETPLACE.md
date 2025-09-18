# Atlassian Marketplace Publishing Guide

This guide walks through publishing the PlantUML Confluence Cloud app to the Atlassian Marketplace using the latest 2025 requirements and best practices.

## Prerequisites

- ✅ Completed app development and testing
- ✅ Atlassian Developer account with verified profile
- ✅ App icons and marketing materials (updated requirements)
- ✅ Privacy policy and security documentation
- ✅ Forge app with licensing enabled (if paid)
- ✅ Free developer instance for testing

## 1. Developer Account & Free Instance Setup

### Get Free Developer Instance

**New in 2025**: Atlassian provides free developer instances for testing:

1. Visit [go.atlassian.com/cloud-dev](http://go.atlassian.com/cloud-dev)
2. Get free licenses for:
   - Confluence: 5 users
   - Jira Software: 5 users
   - Jira Work Management: 5 users
   - Jira Service Management: 1 agent

### Create Developer Account

1. Go to [developer.atlassian.com](https://developer.atlassian.com)
2. Sign up or log in with your Atlassian account
3. Complete **Marketplace Partner Profile**:
   - Company information and branding
   - Contact details and support information
   - Tax information (required for paid apps)
   - Business verification for enterprise features

### Account Verification Requirements

- ✅ Email verification (required)
- ✅ Phone verification (required for paid apps)
- ✅ Business verification (for enterprise features)
- ✅ Tax information (for revenue sharing)

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

### Pricing Model & Revenue Sharing (2025 Updates)

**New Billing Model**: Atlassian is transitioning to **Maximum Quantity Billing** in July 2025.

Choose from three payment models:

#### 1. **Free** (Recommended for Launch)

- No licensing complexity
- Fastest approval process
- Build user base and feedback
- Can transition to paid later (with limitations)

#### 2. **Paid via Atlassian** (Recommended for Revenue)

- **95% revenue share for first year** (Forge apps only!)
- **85% revenue share** after first year (cloud apps)
- Atlassian handles billing and licensing
- Automatic license provisioning
- **Requirements**: Must enable licensing in `manifest.yml`

#### 3. **Paid via Vendor**

- You handle billing and licensing
- 100% revenue (minus payment processing)
- More complex implementation
- Custom licensing system required

**Forge App Licensing Setup**:

```yaml
# manifest.yml
app:
  id: ari:cloud:ecosystem::app/your-app-id
  name: PlantUML for Confluence
  licensing:
    enabled: true # Required for paid apps
```

**Example Pricing Strategy**:

```
Launch Strategy:
1. Start FREE to build user base
2. Gather feedback and testimonials
3. Add paid features after 6 months
4. Leverage 95% revenue share for Forge apps

Pricing Tiers (Future):
- Free: Basic PlantUML rendering
- Pro ($3/month): Advanced themes, formats, priority support
- Enterprise ($10/month): Custom deployment, SLA, advanced security
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

## 4. Permissions & Security (2025 Requirements)

### Required Forge Permissions

**Critical**: You must justify each permission during submission:

```yaml
permissions:
  scopes:
    - read:confluence-content.summary
      # Justification: "Read page metadata to provide macro context and ensure proper rendering"
    - write:confluence-content
      # Justification: "Insert and update PlantUML macros when users save diagrams"
    - read:confluence-space
      # Justification: "Access space information for macro rendering and permission validation"
    - storage:app
      # Justification: "Cache rendered diagrams for performance optimization (hash-based caching)"
  external:
    fetch:
      backend:
        - '*.amazonaws.com'
          # Justification: "Connect to PlantUML rendering service for diagram generation"
```

### Security Requirements (Enhanced 2025)

**New Requirements**: Enhanced security documentation required:

1. **Data Flow Documentation**: Detailed data processing flow
2. **Privacy Impact Assessment**: GDPR compliance documentation
3. **Security Controls**: Input validation, output sanitization
4. **Incident Response**: Security incident handling procedures

### Data Security Declaration

```yaml
dataResidency:
  - region: 'AWS regions (configurable)'
  - description: 'Diagram rendering occurs in specified AWS region'

dataRetention:
  - type: 'Rendered diagrams'
  - duration: 'Cached until eviction (performance only)'
  - type: 'PlantUML source'
  - duration: '0 seconds (not persisted)'

dataProcessing:
  - personalData: false
  - description: 'Only processes diagram source code, no personal information'
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

### Submission Steps (Updated Process)

#### Step 1: Enable App Sharing

```bash
# First, enable sharing in Forge developer console
forge settings set sharing enabled
```

#### Step 2: Create Marketplace Listing

1. Go to [developer.atlassian.com](https://developer.atlassian.com)
2. Navigate to "Your apps" → "Create listing"
3. Select your Forge app from dropdown
4. Complete all required sections

#### Step 3: Required Information

**New Requirements**: Be prepared to provide:

- **API Scope Justifications**: Why each permission is necessary
- **Remote Hostnames**: All external services your app connects to
- **Data Processing Details**: What data is sent where and why
- **Testing Instructions**: Detailed steps for reviewers

#### Step 4: Review Process

1. **Automated Security Scanning**: Forge platform security checks
2. **Manual Functionality Review**: Human reviewer tests your app
3. **Privacy Policy Compliance**: GDPR and data protection review
4. **Performance Testing**: Load and response time validation

#### Common Rejection Reasons (Avoid These!)

- ❌ **Insufficient Error Handling**: App crashes on invalid input
- ❌ **Missing Accessibility**: No keyboard navigation or screen reader support
- ❌ **Unclear Permission Justifications**: Vague reasons for scope requests
- ❌ **Incomplete Documentation**: Missing user guides or privacy policy
- ❌ **Security Vulnerabilities**: XSS, injection, or data exposure issues

### Review Timeline (2025 Updates)

- **Initial Review**: **1 week** (improved from 5-10 days)
- **Resubmission**: 3-5 business days
- **Security Review**: Additional 2-3 days for complex apps
- **Forge Apps**: Faster review process due to platform security

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

## 13. 2025 Marketplace Launch Checklist

### Pre-Launch Checklist

- [ ] **Free Developer Instance**: Set up and tested
- [ ] **Forge App**: Deployed to production environment
- [ ] **Licensing**: Enabled in manifest.yml (if paid)
- [ ] **Sharing**: Enabled in developer console
- [ ] **Partner Profile**: Complete with tax information
- [ ] **Privacy Policy**: GDPR compliant and comprehensive
- [ ] **Security Documentation**: Data flow and controls documented
- [ ] **Icons & Screenshots**: All required sizes and formats
- [ ] **Permission Justifications**: Clear explanations for each scope
- [ ] **Testing**: Comprehensive testing in free developer instance

### Launch Strategy Recommendations

#### Phase 1: Free Launch (Months 1-6)

- Launch as **FREE** app to build user base
- Focus on user feedback and testimonials
- Build community and support resources
- Gather usage analytics and performance data

#### Phase 2: Monetization (Months 6+)

- Add **Paid via Atlassian** model
- Leverage **95% revenue share** for first year (Forge benefit)
- Implement tiered pricing based on user feedback
- Add premium features and enterprise support

### Success Metrics (2025 Standards)

- **Adoption**: >100 installations in first month
- **Rating**: Maintain 4+ stars consistently
- **Support**: <2% support ticket rate
- **Performance**: <3s response time, >99% uptime
- **Security**: Zero security incidents or vulnerabilities

---

## Quick Start for PlantUML App

**Ready to publish?** Here's your action plan:

1. **Test in Free Instance**: Install and test thoroughly
2. **Complete Partner Profile**: Set up billing and tax info
3. **Prepare Documentation**: Privacy policy, user guides, security docs
4. **Create Marketing Materials**: Screenshots, descriptions, icons
5. **Submit for Review**: Enable sharing and create marketplace listing
6. **Launch Free**: Start with free model to build user base
7. **Monitor & Iterate**: Gather feedback and improve
8. **Monetize**: Add paid features after establishing user base

**Estimated Timeline**: 2-3 weeks from submission to approval  
**Success Criteria**: 4+ star rating, growing user base, positive feedback

**Need Help?**

- [Developer Community](https://community.developer.atlassian.com/)
- [Marketplace Support](https://ecosystem.atlassian.net/servicedesk/customer/portal/34/group/110/create/556)
- [Partner Program](https://developer.atlassian.com/platform/marketplace/marketplace-partner-program/)
