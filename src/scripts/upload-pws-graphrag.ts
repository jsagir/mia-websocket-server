import dotenv from 'dotenv';
import { getPWSFileSearchGraphRAGService, type CustomMetadata } from '../services/pws-filesearch-graphrag.service';
import { logger } from '../utils/logger';

dotenv.config();

/**
 * PWS Curriculum GraphRAG Upload Script
 *
 * Uploads curriculum materials to multiple specialized File Search stores
 * with rich metadata to simulate graph relationships.
 */

interface DocumentUpload {
  storeName: string;
  filePath: string;
  displayName: string;
  metadata: CustomMetadata[];
}

// Lecture metadata mappings
const LECTURE_CONFIGS: Record<string, any> = {
  N01: {
    title: 'Framework for Innovation',
    week: 1,
    module: 'introduction',
    problemTypes: 'all',
    frameworks: 'creative_destruction,innovation_types,entrepreneurship',
    tools: '',
    relatedLectures: 'N02,N03',
    nextLecture: 'N02',
    hasExamples: 'true',
    difficulty: 'foundational'
  },
  N02: {
    title: 'Tools for Un-defined Problems',
    week: 2,
    module: 'problem_taxonomy',
    problemTypes: 'un-defined',
    frameworks: 'strategic_foresight,future_back_thinking',
    tools: 'trending_to_absurd,scenario_analysis,nested_hierarchies,weak_signals',
    relatedLectures: 'N01,N03,N04',
    previousLecture: 'N01',
    nextLecture: 'N03',
    hasExamples: 'true',
    difficulty: 'foundational'
  },
  N03: {
    title: 'Ill-Defined Problems',
    week: 3,
    module: 'problem_taxonomy',
    problemTypes: 'ill-defined',
    frameworks: 'problem_theory',
    tools: '2x2_matrix,nested_hierarchies,extensive_intensive_search',
    relatedLectures: 'N02,N04',
    previousLecture: 'N02',
    nextLecture: 'N04',
    hasExamples: 'true',
    difficulty: 'foundational'
  },
  N04: {
    title: 'Wicked Problems',
    week: 4,
    module: 'problem_taxonomy',
    problemTypes: 'wicked',
    frameworks: 'problem_theory,rittel_webber',
    tools: 'systems_thinking,stakeholder_analysis',
    relatedLectures: 'N02,N03',
    previousLecture: 'N03',
    nextLecture: 'N05',
    hasExamples: 'true',
    difficulty: 'intermediate'
  },
  N05: {
    title: 'Domain-Specific Innovation',
    week: 5,
    module: 'exploration_tools',
    problemTypes: 'all',
    frameworks: 'domain_specific_methods',
    tools: 'domain_analysis',
    relatedLectures: 'N01,N06',
    previousLecture: 'N04',
    nextLecture: 'N06',
    hasExamples: 'true',
    difficulty: 'intermediate'
  },
  N06: {
    title: 'Portfolio Approach',
    week: 6,
    module: 'portfolio',
    problemTypes: 'all',
    frameworks: 'three_box_solution,portfolio_management',
    tools: 'portfolio_matrix',
    relatedLectures: 'N01,N05,N07',
    previousLecture: 'N05',
    nextLecture: 'N07',
    hasExamples: 'true',
    difficulty: 'advanced'
  },
  N07: {
    title: 'Well-Defined Problems',
    week: 7,
    module: 'execution_tools',
    problemTypes: 'well-defined',
    frameworks: 'structured_problem_solving',
    tools: 'gantt_charts,pert_cpm',
    relatedLectures: 'N06,N08',
    previousLecture: 'N06',
    nextLecture: 'N08',
    hasExamples: 'true',
    difficulty: 'intermediate'
  },
  N08: {
    title: 'Prior Art and Research',
    week: 8,
    module: 'execution_tools',
    problemTypes: 'well-defined',
    frameworks: 'research_methodology',
    tools: 'literature_review,patent_search',
    relatedLectures: 'N07,N08b',
    previousLecture: 'N07',
    nextLecture: 'N08b',
    hasExamples: 'true',
    difficulty: 'advanced'
  },
  'N08b': {
    title: 'Technical Planning',
    week: 9,
    module: 'execution_tools',
    problemTypes: 'well-defined',
    frameworks: 'running_lean,lean_startup',
    tools: 'technical_planning,mvp_definition',
    relatedLectures: 'N08,N09',
    previousLecture: 'N08',
    nextLecture: 'N09',
    hasExamples: 'true',
    difficulty: 'advanced'
  },
  N09: {
    title: 'Project Documentation',
    week: 10,
    module: 'capstone',
    problemTypes: 'all',
    frameworks: 'documentation_standards',
    tools: 'report_writing,presentation',
    relatedLectures: 'N08b,N10',
    previousLecture: 'N08b',
    nextLecture: 'N10',
    hasExamples: 'true',
    difficulty: 'advanced'
  },
  N10: {
    title: 'Capstone Project',
    week: 11,
    module: 'capstone',
    problemTypes: 'all',
    frameworks: 'integrated_innovation',
    tools: 'all',
    relatedLectures: 'N01,N02,N03,N04,N05,N06,N07,N08,N09',
    previousLecture: 'N09',
    hasExamples: 'true',
    difficulty: 'advanced'
  }
};

async function main() {
  try {
    logger.info('🚀 Starting PWS GraphRAG Curriculum Upload');

    const service = getPWSFileSearchGraphRAGService();

    // Step 1: Initialize all stores
    await service.initializeStores();

    const uploads: DocumentUpload[] = [];

    // ==========================================
    // STORE 1: LECTURES
    // ==========================================
    logger.info('\n📚 Preparing lecture uploads...');

    for (const [lectureId, config] of Object.entries(LECTURE_CONFIGS)) {
      uploads.push({
        storeName: 'lectures',
        filePath: `curriculum/lectures/${lectureId}_*.pptx`,  // Wildcard
        displayName: `${lectureId}: ${config.title}`,
        metadata: [
          { key: 'doc_type', string_value: 'lecture' },
          { key: 'lecture_id', string_value: lectureId },
          { key: 'title', string_value: config.title },
          { key: 'week', numeric_value: config.week },
          { key: 'module', string_value: config.module },
          { key: 'difficulty', string_value: config.difficulty },
          { key: 'problem_types', string_value: config.problemTypes },
          { key: 'frameworks_mentioned', string_value: config.frameworks },
          { key: 'tools_introduced', string_value: config.tools },
          { key: 'related_lectures', string_value: config.relatedLectures },
          { key: 'previous_lecture', string_value: config.previousLecture || '' },
          { key: 'next_lecture', string_value: config.nextLecture || '' },
          { key: 'has_examples', string_value: config.hasExamples }
        ]
      });
    }

    // ==========================================
    // STORE 2: FRAMEWORKS
    // ==========================================
    logger.info('\n🎯 Preparing framework uploads...');

    const frameworks = [
      {
        id: 'creative_destruction',
        name: 'Creative Destruction',
        author: 'Joseph Schumpeter',
        year: 1942,
        appliesTo: 'un-defined,ill-defined',
        relatedFrameworks: 'innovators_dilemma,disruptive_innovation',
        lectures: 'N01,N02,N05',
        difficulty: 'intermediate'
      },
      {
        id: 'innovators_dilemma',
        name: 'The Innovator\'s Dilemma',
        author: 'Clayton Christensen',
        year: 1997,
        appliesTo: 'ill-defined',
        relatedFrameworks: 'creative_destruction,disruptive_innovation',
        lectures: 'N02,N06',
        difficulty: 'intermediate'
      },
      {
        id: 'diffusion_theory',
        name: 'Diffusion of Innovations',
        author: 'Everett Rogers',
        year: 1962,
        appliesTo: 'all',
        relatedFrameworks: 'adoption_curve',
        lectures: 'N01,N03',
        difficulty: 'foundational'
      },
      {
        id: 'three_box_solution',
        name: 'The Three Box Solution',
        author: 'Vijay Govindarajan',
        year: 2016,
        appliesTo: 'all',
        relatedFrameworks: 'portfolio_management',
        lectures: 'N06',
        difficulty: 'advanced'
      },
      {
        id: 'running_lean',
        name: 'Running Lean',
        author: 'Ash Maurya',
        year: 2012,
        appliesTo: 'well-defined',
        relatedFrameworks: 'lean_startup,mvp',
        lectures: 'N08b',
        difficulty: 'intermediate'
      }
    ];

    for (const fw of frameworks) {
      uploads.push({
        storeName: 'frameworks',
        filePath: `curriculum/frameworks/${fw.id}.txt`,
        displayName: fw.name,
        metadata: [
          { key: 'entity_type', string_value: 'framework' },
          { key: 'framework_id', string_value: fw.id },
          { key: 'framework_name', string_value: fw.name },
          { key: 'author', string_value: fw.author },
          { key: 'year', numeric_value: fw.year },
          { key: 'applies_to_problem_types', string_value: fw.appliesTo },
          { key: 'related_frameworks', string_value: fw.relatedFrameworks },
          { key: 'mentioned_in_lectures', string_value: fw.lectures },
          { key: 'difficulty_level', string_value: fw.difficulty }
        ]
      });
    }

    // ==========================================
    // STORE 3: PROBLEM TYPES
    // ==========================================
    logger.info('\n🔍 Preparing problem type uploads...');

    const problemTypes = [
      {
        id: 'un-defined',
        name: 'Un-defined Problem',
        timeHorizon: '11-30 years',
        uncertainty: 'high',
        primaryLecture: 'N02',
        relatedLectures: 'N01,N04,N05',
        tools: 'trending_to_absurd,scenario_analysis,nested_hierarchies,red_teaming',
        frameworks: 'creative_destruction,strategic_foresight',
        domains: 'energy_future,medical_care,education,war'
      },
      {
        id: 'ill-defined',
        name: 'Ill-defined Problem',
        timeHorizon: '2-10 years',
        uncertainty: 'medium',
        primaryLecture: 'N03',
        relatedLectures: 'N02,N04',
        tools: '2x2_matrix,nested_hierarchies,extensive_intensive_search',
        frameworks: 'problem_theory,innovators_dilemma',
        domains: 'business_strategy,product_development'
      },
      {
        id: 'well-defined',
        name: 'Well-defined Problem',
        timeHorizon: '0-1 years',
        uncertainty: 'low',
        primaryLecture: 'N07',
        relatedLectures: 'N08,N08b',
        tools: 'gantt_charts,pert_cpm,technical_planning',
        frameworks: 'running_lean,structured_methodology',
        domains: 'engineering,implementation'
      }
    ];

    for (const pt of problemTypes) {
      uploads.push({
        storeName: 'problemTypes',
        filePath: `curriculum/problem_types/${pt.id}.txt`,
        displayName: pt.name,
        metadata: [
          { key: 'entity_type', string_value: 'problem_type' },
          { key: 'problem_type_id', string_value: pt.id },
          { key: 'problem_type_name', string_value: pt.name },
          { key: 'time_horizon', string_value: pt.timeHorizon },
          { key: 'uncertainty_level', string_value: pt.uncertainty },
          { key: 'primary_lecture', string_value: pt.primaryLecture },
          { key: 'related_lectures', string_value: pt.relatedLectures },
          { key: 'tools_used', string_value: pt.tools },
          { key: 'frameworks_applicable', string_value: pt.frameworks },
          { key: 'example_domains', string_value: pt.domains }
        ]
      });
    }

    // ==========================================
    // STORE 4: TOOLS
    // ==========================================
    logger.info('\n🛠️  Preparing tool uploads...');

    const tools = [
      {
        id: 'trending_to_absurd',
        name: 'Trending to the Absurd',
        category: 'exploration',
        problemType: 'un-defined',
        lecture: 'N02',
        difficulty: 'intermediate'
      },
      {
        id: 'scenario_analysis',
        name: 'Scenario Analysis',
        category: 'exploration',
        problemType: 'un-defined',
        lecture: 'N02',
        difficulty: 'intermediate'
      },
      {
        id: '2x2_matrix',
        name: '2x2 Matrix',
        category: 'analysis',
        problemType: 'ill-defined',
        lecture: 'N03',
        difficulty: 'foundational'
      },
      {
        id: 'nested_hierarchies',
        name: 'Nested Hierarchies',
        category: 'analysis',
        problemType: 'ill-defined,un-defined',
        lecture: 'N02,N03',
        difficulty: 'intermediate'
      }
    ];

    for (const tool of tools) {
      uploads.push({
        storeName: 'tools',
        filePath: `curriculum/tools/${tool.id}.txt`,
        displayName: tool.name,
        metadata: [
          { key: 'entity_type', string_value: 'tool' },
          { key: 'tool_id', string_value: tool.id },
          { key: 'tool_name', string_value: tool.name },
          { key: 'tool_category', string_value: tool.category },
          { key: 'used_for_problem_type', string_value: tool.problemType },
          { key: 'introduced_in_lecture', string_value: tool.lecture },
          { key: 'difficulty', string_value: tool.difficulty }
        ]
      });
    }

    // ==========================================
    // STORE 5: SYLLABUS
    // ==========================================
    logger.info('\n📋 Preparing syllabus uploads...');

    uploads.push({
      storeName: 'syllabus',
      filePath: 'curriculum/docs/Syllabouse.pdf',
      displayName: 'Course Syllabus',
      metadata: [
        { key: 'doc_type', string_value: 'syllabus' },
        { key: 'course_name', string_value: 'PWS Innovation' },
        { key: 'duration_weeks', numeric_value: 15 }
      ]
    });

    // ==========================================
    // STORE 6: EXAMPLES
    // ==========================================
    logger.info('\n💡 Preparing example uploads...');

    uploads.push({
      storeName: 'examples',
      filePath: 'curriculum/examples/nato_hub_case.txt',
      displayName: 'NATO Innovation Hub Case Study',
      metadata: [
        { key: 'entity_type', string_value: 'case_study' },
        { key: 'case_id', string_value: 'nato_hub' },
        { key: 'industry', string_value: 'defense' },
        { key: 'problem_type', string_value: 'ill-defined' },
        { key: 'demonstrates_tools', string_value: 'extensive_searching,intensive_searching' },
        { key: 'related_to_lecture', string_value: 'N03' }
      ]
    });

    // ==========================================
    // STORE 7: REFERENCES
    // ==========================================
    logger.info('\n📖 Preparing reference uploads...');

    uploads.push({
      storeName: 'references',
      filePath: 'curriculum/books/A More Beautiful Question.pdf',
      displayName: 'A More Beautiful Question',
      metadata: [
        { key: 'doc_type', string_value: 'reference_book' },
        { key: 'author', string_value: 'Warren Berger' },
        { key: 'year', numeric_value: 2014 },
        { key: 'referenced_in_lectures', string_value: 'N03,N07' },
        { key: 'relevant_to_problem_types', string_value: 'ill-defined,well-defined' }
      ]
    });

    // ==========================================
    // EXECUTE UPLOADS
    // ==========================================
    logger.info(`\n🚀 Uploading ${uploads.length} documents...`);

    let successCount = 0;
    let errorCount = 0;

    for (const upload of uploads) {
      try {
        await service.uploadDocument(
          upload.storeName,
          upload.filePath,
          upload.metadata,
          upload.displayName
        );
        successCount++;
      } catch (error) {
        errorCount++;
        logger.error(`❌ Failed: ${upload.displayName}`, error);
      }
    }

    logger.info('\n📊 Upload Summary:');
    logger.info(`   ✅ Successful: ${successCount}`);
    logger.info(`   ❌ Failed: ${errorCount}`);
    logger.info(`   📁 Total: ${uploads.length}`);
    logger.info('\n🎉 PWS GraphRAG Upload Complete!');

    // Print store statistics
    const health = await service.getHealthStatus();
    logger.info('\n📈 Store Health:');
    for (const [name, status] of Object.entries(health.stores)) {
      logger.info(`   ${name}: ${(status as any).status}`);
    }
  } catch (error) {
    logger.error('❌ Upload script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('Fatal error:', error);
      process.exit(1);
    });
}

export { main as uploadPWSGraphRAG };
