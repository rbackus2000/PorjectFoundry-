import { PRD, BackendSpec, FrontendSpec, UISpec } from "../zodSchemas";

type Platform = "web" | "ios" | "android";

interface MasterPromptOptions {
  prd: PRD;
  backendSpec: BackendSpec;
  frontendSpec: FrontendSpec;
  uiSpec: UISpec;
  mermaidFlow: string;
  mermaidERD: string;
  projectGraph: any; // The canvas graph data
  platforms: Platform[]; // Target platforms for this project
}

// Helper functions for platform-specific content
function getTechStack(platforms: Platform[], backendSpec: BackendSpec) {
  const isWeb = platforms.includes("web");
  const isIOS = platforms.includes("ios");
  const isAndroid = platforms.includes("android");
  const isMultiPlatform = platforms.length > 1;

  let stack = "";

  if (isWeb) {
    stack += `### Web Application
- **Framework**: Next.js 14+ (App Router, Server Components)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS + shadcn/ui components
- **Deployment**: Vercel (recommended) or self-hosted
- **Database Hosting**: Supabase or Neon PostgreSQL

`;
  }

  if (isIOS) {
    stack += `### iOS Application
- **Framework**: SwiftUI (iOS 17+)
- **Language**: Swift 5.9+
- **Architecture**: MVVM with Combine
- **Database**: Firebase Firestore or Core Data + CloudKit
- **Authentication**: Sign in with Apple + Backend Auth
- **UI Components**: Native SwiftUI components
- **Deployment**: App Store via Xcode Cloud or Fastlane
- **Minimum iOS Version**: iOS 17.0

`;
  }

  if (isAndroid) {
    stack += `### Android Application
- **Framework**: Jetpack Compose
- **Language**: Kotlin
- **Architecture**: MVVM with Kotlin Flows
- **Database**: Firebase Firestore or Room + SQLite
- **Authentication**: Custom Backend Auth
- **UI Components**: Material Design 3 with Compose
- **Deployment**: Google Play Store via Android Studio
- **Minimum SDK**: Android 8.0 (API 26)

`;
  }

  if (isMultiPlatform) {
    stack += `### Shared Backend
- **API Layer**: RESTful API (see API Specification section)
- **Database**: ${isWeb ? "PostgreSQL" : "Firebase Firestore"} (shared across platforms)
- **Authentication**: Unified auth system across all platforms
- **Integrations**: ${backendSpec.integrations?.map(i => i.service).join(", ") || "None"}

`;
  }

  return stack;
}

function getProjectStructure(platforms: Platform[], prd: PRD) {
  const isWeb = platforms.includes("web");
  const isIOS = platforms.includes("ios");
  const isAndroid = platforms.includes("android");
  const projectName = prd.title.toLowerCase().replace(/\s+/g, "-");

  let structure = "";

  if (isWeb) {
    structure += `### Web Application Structure
\`\`\`
${projectName}-web/
├── app/
│   ├── (auth)/          # Authentication routes
│   ├── (dashboard)/     # Main app routes
│   ├── api/             # API routes
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Landing page
├── components/
│   ├── ui/              # shadcn components
│   └── custom/          # Custom components
├── lib/
│   ├── db.ts            # Prisma client
│   ├── auth.ts          # Auth utilities
│   └── utils.ts         # Helper functions
└── prisma/
    └── schema.prisma    # Database schema
\`\`\`

`;
  }

  if (isIOS) {
    structure += `### iOS Application Structure
\`\`\`
${projectName}-ios/
├── ${projectName}/
│   ├── App/
│   │   ├── ${projectName}App.swift      # App entry point
│   │   └── ContentView.swift            # Root view
│   ├── Features/
│   │   ├── Auth/                        # Authentication
│   │   ├── Dashboard/                   # Main screens
│   │   └── Profile/                     # User profile
│   ├── Models/                          # Data models
│   ├── ViewModels/                      # MVVM view models
│   ├── Services/
│   │   ├── APIService.swift             # Backend API
│   │   ├── AuthService.swift            # Authentication
│   │   └── DatabaseService.swift        # Local/remote DB
│   └── Views/
│       └── Components/                  # Reusable components
├── ${projectName}.xcodeproj
└── Podfile (if using CocoaPods)
\`\`\`

`;
  }

  if (isAndroid) {
    structure += `### Android Application Structure
\`\`\`
${projectName}-android/
├── app/
│   └── src/
│       └── main/
│           ├── java/com/${projectName}/
│           │   ├── MainActivity.kt
│           │   ├── ui/
│           │   │   ├── auth/            # Auth screens
│           │   │   ├── dashboard/       # Main screens
│           │   │   └── components/      # Reusable composables
│           │   ├── viewmodel/           # ViewModels
│           │   ├── model/               # Data models
│           │   ├── repository/          # Data layer
│           │   └── service/
│           │       ├── ApiService.kt
│           │       └── AuthService.kt
│           ├── res/                     # Resources
│           └── AndroidManifest.xml
├── build.gradle.kts
└── settings.gradle.kts
\`\`\`

`;
  }

  return structure;
}

function getBuildInstructions(platforms: Platform[], prd: PRD, backendSpec: BackendSpec) {
  const projectName = prd.title.toLowerCase().replace(/\s+/g, "-");
  let instructions = "";

  platforms.forEach((platform) => {
    if (platform === "web") {
      instructions += `## Build Instructions: Web Application

### Step 1: Project Initialization
\`\`\`bash
npx create-next-app@latest ${projectName}-web --typescript --tailwind --app
cd ${projectName}-web
\`\`\`

### Step 2: Install Dependencies
\`\`\`bash
npm install prisma @prisma/client
npm install next-auth
npm install -D prettier eslint
npx shadcn-ui@latest init
\`\`\`

### Step 3: Set Up Database
1. Create \`prisma/schema.prisma\` with the database schema from the ERD section
2. Run \`npx prisma generate\`
3. Run \`npx prisma db push\` to create tables

### Step 4: Implement Features
Build each feature in order of priority (see Implementation Priority section)

### Step 5: Testing & Validation
- Test each feature against acceptance criteria
- Verify all user flows work end-to-end
- Check database relationships and constraints

### Step 6: Deploy
\`\`\`bash
npm run build
vercel deploy
\`\`\`

`;
    }

    if (platform === "ios") {
      instructions += `## Build Instructions: iOS Application

### Step 1: Project Creation
1. Open Xcode
2. Create new iOS App project: "${prd.title}"
3. Select SwiftUI interface and Swift language
4. Choose organization identifier

### Step 2: Dependencies
Add via Swift Package Manager:
\`\`\`swift
// In Xcode: File > Add Package Dependencies
- Alamofire (for API networking)
- SDWebImageSwiftUI (for image loading)
${backendSpec.integrations?.some(i => i.service.toLowerCase().includes("firebase")) ? "- Firebase iOS SDK (Auth, Firestore, Storage)" : ""}
\`\`\`

### Step 3: Project Structure
Create the folder structure shown in the iOS Application Structure section

### Step 4: Configure Services
1. Set up authentication service
2. Configure API endpoints
3. Set up database layer (Firebase or Core Data)

### Step 5: Implement Features
Build each screen and feature following the UI Specification

### Step 6: Testing
- Run unit tests: Cmd+U
- Test on simulator and physical devices
- Verify all user flows

### Step 7: Deploy
1. Configure signing & capabilities
2. Archive build: Product > Archive
3. Submit to App Store via Xcode or Fastlane

`;
    }

    if (platform === "android") {
      instructions += `## Build Instructions: Android Application

### Step 1: Project Creation
1. Open Android Studio
2. New Project > Empty Compose Activity
3. Name: "${prd.title}"
4. Package: com.${projectName}
5. Minimum SDK: 26 (Android 8.0)

### Step 2: Dependencies
Add to \`build.gradle.kts\`:
\`\`\`kotlin
dependencies {
    // Compose
    implementation(platform("androidx.compose:compose-bom:2024.01.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.6")

    // ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")

    ${backendSpec.integrations?.some(i => i.service.toLowerCase().includes("firebase")) ? `// Firebase
    implementation(platform("com.google.firebase:firebase-bom:32.7.0"))
    implementation("com.google.firebase:firebase-auth-ktx")
    implementation("com.google.firebase:firebase-firestore-ktx")
    ` : ""}
    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
}
\`\`\`

### Step 3: Project Structure
Create the folder structure shown in the Android Application Structure section

### Step 4: Configure Services
1. Set up authentication
2. Configure API client (Retrofit)
3. Set up database layer

### Step 5: Implement Features
Build each screen using Jetpack Compose following the UI Specification

### Step 6: Testing
\`\`\`bash
./gradlew test
./gradlew connectedAndroidTest
\`\`\`

### Step 7: Deploy
1. Generate signed APK/Bundle
2. Upload to Google Play Console
3. Submit for review

`;
    }
  });

  return instructions;
}

export function buildMasterPrompt(opts: MasterPromptOptions): string {
  const { prd, backendSpec, frontendSpec, uiSpec, mermaidFlow, mermaidERD, projectGraph, platforms } = opts;

  // Platform context
  const platformNames = platforms.map(p => {
    if (p === "web") return "Web Application";
    if (p === "ios") return "iOS Application";
    if (p === "android") return "Android Application";
    return p;
  }).join(" + ");

  return `# PROJECT: ${prd.title}
**Target Platform(s)**: ${platformNames}

## 1. OVERVIEW

${prd.overview}

**Problem Statement**: ${prd.problemStatement}

**Goals**:
${prd.goals.map(g => `- ${g}`).join("\n")}

${prd.nonGoals && prd.nonGoals.length > 0 ? `**Non-Goals**:
${prd.nonGoals.map(ng => `- ${ng}`).join("\n")}` : ""}

**User Personas**:
${prd.userPersonas?.map(p => `
- **${p.name}** (${p.role})
  - Goals: ${p.goals.join(", ")}
  - Pain Points: ${p.painPoints.join(", ")}
`).join("\n") || "Target users to be defined"}

**Success Metrics**:
${prd.successMetrics?.map(m => `- ${m.metric}: ${m.target}${m.timeframe ? ` (${m.timeframe})` : ""}`).join("\n") || "- User adoption and engagement"}

---

## 2. TECH STACK

${getTechStack(platforms, backendSpec)}

---

## 3. DATABASE SCHEMA

The complete database schema with all relationships:

\`\`\`mermaid
${mermaidERD}
\`\`\`

### Database Entities

${backendSpec.entities?.map(entity => `
#### ${entity.name}

**Fields**:
${entity.fields.map(f => `- \`${f.name}\`: ${f.type}${f.required ? " (required)" : ""}${f.unique ? " (unique)" : ""}${f.relation ? ` → ${f.relation}` : ""}`).join("\n")}

${entity.indexes?.length ? `**Indexes**: ${entity.indexes.join(", ")}` : ""}
`).join("\n") || "*Database entities will be defined during implementation*"}

---

## 4. FEATURES & MODULES

The application is organized into these functional modules:

${projectGraph?.nodes?.map((node: any, idx: number) => `
### ${idx + 1}. ${node.label || node.id}
- **Status**: ${node.status === "in" ? "✅ In Scope" : node.status === "out" ? "❌ Out of Scope" : "⚠️ Maybe"}
- **Category**: ${node.category || "Feature"}
- **Description**: ${node.description || "Core feature module"}

**Related Modules**: ${projectGraph.edges?.filter((e: any) => e.source === node.id).map((e: any) => {
  const target = projectGraph.nodes.find((n: any) => n.id === e.target);
  return target?.label || e.target;
}).join(", ") || "None"}
`).join("\n") || "*Modules will be extracted from PRD features*"}

---

## 5. DETAILED FEATURES

${prd.features.map((feature, idx) => `
### Feature ${idx + 1}: ${feature.name}

**Priority**: ${feature.priority}

**Description**: ${feature.description}

${feature.dependencies?.length ? `**Dependencies**: ${feature.dependencies.join(", ")}` : ""}

${feature.moduleIds?.length ? `**Related Modules**: ${feature.moduleIds.join(", ")}` : ""}
`).join("\n")}

## 5.1 USER STORIES

${prd.userStories.map((story, idx) => `
### Story ${idx + 1}: ${story.id}

**Persona**: ${story.persona}

**Story**: ${story.story}

**Acceptance Criteria**:
${story.acceptanceCriteria.map(ac => `- ${ac}`).join("\n")}
`).join("\n")}

---

## 6. USER FLOWS

Visual representation of how users interact with the system:

\`\`\`mermaid
${mermaidFlow}
\`\`\`

---

## 7. UI SPECIFICATION

### Design System

${uiSpec.designSystem ? `
**Colors**:
${uiSpec.designSystem.colors?.map(c => `- ${c.name}: ${c.hex}${c.usage ? ` (${c.usage})` : ""}`).join("\n") || "- Colors to be defined"}

**Typography**:
${uiSpec.designSystem.typography?.map(t => `- ${t.name}: ${t.fontSize}px / ${t.lineHeight}${t.fontWeight ? `, weight ${t.fontWeight}` : ""}`).join("\n") || "- Typography to be defined"}

${uiSpec.designSystem.spacing ? `**Spacing Scale**: ${uiSpec.designSystem.spacing.join(", ")} (px)` : ""}
${uiSpec.designSystem.borderRadius ? `**Border Radius**: ${uiSpec.designSystem.borderRadius.join(", ")} (px)` : ""}
` : "*Design system to be defined*"}

### UI Components

${uiSpec.components?.map(comp => `
#### ${comp.name}

- Type: ${comp.type}
${comp.variants?.length ? `- Variants: ${comp.variants.join(", ")}` : ""}
${comp.states?.length ? `- States: ${comp.states.join(", ")}` : ""}
${comp.description ? `- Description: ${comp.description}` : ""}
`).join("\n") || "*UI components will be designed based on features*"}

### Screens

${uiSpec.screens?.map(screen => `
#### ${screen.name}

**Route**: \`${screen.path}\`

**Layout**: ${screen.layout || "Standard application layout"}

**Components Used**: ${screen.components?.join(", ") || "None"}

${screen.wireframe ? `**Wireframe**:\n\`\`\`\n${screen.wireframe}\n\`\`\`` : ""}
`).join("\n") || "*UI screens will be designed based on features*"}

---

## 8. API SPECIFICATION

### Endpoints

${backendSpec.apis?.map(api => `
#### ${api.method} ${api.path}

**Description**: ${api.description}

**Authentication**: ${api.auth ? "✅ Required" : "❌ Not required"}

${api.params?.length ? `**Parameters**:
${api.params.map(p => `- \`${p.name}\` (${p.type})${p.required ? " - required" : ""}`).join("\n")}` : ""}
`).join("\n") || "*API endpoints will be created for each feature*"}

${backendSpec.jobs?.length ? `### Background Jobs

${backendSpec.jobs.map(job => `
#### ${job.name}

**Trigger**: ${job.trigger}

**Description**: ${job.description}
`).join("\n")}` : ""}

${backendSpec.integrations?.length ? `### External Integrations

${backendSpec.integrations.map(int => `- **${int.service}**: ${int.purpose}`).join("\n")}` : ""}

---

## 9. PROJECT STRUCTURE

${getProjectStructure(platforms, prd)}

---

## 10. BUILD INSTRUCTIONS

${getBuildInstructions(platforms, prd, backendSpec)}

---

## 11. ACCEPTANCE CRITERIA (MUST PASS)

### Global Requirements
${platforms.includes("web") ? `- ✅ All database migrations run without errors
- ✅ Application builds successfully (\`npm run build\`)
- ✅ TypeScript has no errors` : ""}
${platforms.includes("ios") ? `- ✅ Xcode project builds without errors
- ✅ All Swift files compile successfully
- ✅ App runs on iOS simulator and devices` : ""}
${platforms.includes("android") ? `- ✅ Gradle build completes successfully
- ✅ All Kotlin files compile successfully
- ✅ App runs on Android emulator and devices` : ""}
- ✅ All routes/screens are accessible
- ✅ Authentication works end-to-end
- ✅ Forms have proper validation

### Feature-Specific Criteria

${prd.features.map((f, idx) => `
**${idx + 1}. ${f.name}** (Priority: ${f.priority})
- [ ] Feature is implemented and functional
- [ ] All related user stories pass acceptance criteria
${f.dependencies?.length ? `- [ ] Dependencies resolved: ${f.dependencies.join(", ")}` : ""}
`).join("\n")}

### User Story Acceptance Criteria

${prd.userStories.map((story, idx) => `
**Story ${idx + 1}: ${story.id}**
${story.acceptanceCriteria.map(ac => `- [ ] ${ac}`).join("\n")}
`).join("\n")}

---

## 12. IMPLEMENTATION PRIORITY

Build in this order to maintain working increments:

1. **Foundation** (Database + Auth)
   - Set up database schema
   - Implement authentication
   - Create base layout

2. **P0 Features** (Critical - Must Have)
${prd.features.filter(f => f.priority === "P0").map(f => `   - ${f.name}`).join("\n") || "   - None"}

3. **P1 Features** (High Priority)
${prd.features.filter(f => f.priority === "P1").map(f => `   - ${f.name}`).join("\n") || "   - None"}

4. **P2 Features** (Medium Priority)
${prd.features.filter(f => f.priority === "P2").map(f => `   - ${f.name}`).join("\n") || "   - None"}

5. **P3 Features** (Nice to Have)
${prd.features.filter(f => f.priority === "P3").map(f => `   - ${f.name}`).join("\n") || "   - None"}

---

## 13. FINAL DELIVERABLE

${platforms.includes("web") ? `### Web Application
- Fully functional Next.js application
- Matches all specifications in this document
- Passes all acceptance criteria
- Production-ready and deployable to Vercel
- Has proper error handling and user feedback
- Follows Next.js and React best practices
- Type-safe with TypeScript
- Clean, professional UI using Tailwind + shadcn/ui

` : ""}${platforms.includes("ios") ? `### iOS Application
- Fully functional SwiftUI application
- Matches all specifications in this document
- Passes all acceptance criteria
- Production-ready for App Store submission
- Proper error handling and user feedback
- Follows iOS Human Interface Guidelines
- Native iOS experience with SwiftUI
- Supports iOS 17.0 and later

` : ""}${platforms.includes("android") ? `### Android Application
- Fully functional Jetpack Compose application
- Matches all specifications in this document
- Passes all acceptance criteria
- Production-ready for Play Store submission
- Proper error handling and user feedback
- Follows Material Design 3 guidelines
- Native Android experience with Compose
- Supports Android 8.0 (API 26) and later

` : ""}
**Ready to build? Start with the Build Instructions for your target platform(s) and work through each section systematically.**
`;
}
