import dotenv from 'dotenv';
import { getPWSFileSearchService } from '../services/pws-filesearch.service';
import { logger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config();

/**
 * PWS Curriculum Upload Script
 *
 * This script uploads and indexes curriculum materials to Gemini File Search.
 * It organizes materials by:
 * - Module (Introduction, Problem Taxonomy, Exploration Tools, etc.)
 * - Difficulty (foundational, intermediate, advanced)
 * - Topic (problem types, frameworks, tools)
 * - Lecture number (N01-N10)
 */

interface CurriculumFile {
  filePath: string;
  displayName: string;
  module: string;
  topic: string;
  difficulty: 'foundational' | 'intermediate' | 'advanced';
  framework?: string;
  lectureNumber?: string;
}

// Define curriculum materials structure
const CURRICULUM_MATERIALS: CurriculumFile[] = [
  // Core Lectures (N01-N10)
  {
    filePath: 'curriculum/lectures/N01_Introduction.pptx',
    displayName: 'N01: Framework for Innovation',
    module: 'Introduction Module',
    topic: 'innovation-fundamentals',
    difficulty: 'foundational',
    lectureNumber: 'N01',
    framework: 'Creative Destruction'
  },
  {
    filePath: 'curriculum/lectures/N02_UnDefined.pptx',
    displayName: 'N02: Tools for Un-defined Problems',
    module: 'Problem Taxonomy Module',
    topic: 'undefined-problems',
    difficulty: 'foundational',
    lectureNumber: 'N02'
  },
  {
    filePath: 'curriculum/lectures/N03_IllDefined.pptx',
    displayName: 'N03: Ill-Defined Problems',
    module: 'Problem Taxonomy Module',
    topic: 'ill-defined-problems',
    difficulty: 'foundational',
    lectureNumber: 'N03'
  },
  {
    filePath: 'curriculum/lectures/N04_Wicked Problems.pptx',
    displayName: 'N04: Wicked Problems',
    module: 'Problem Taxonomy Module',
    topic: 'wicked-problems',
    difficulty: 'intermediate',
    lectureNumber: 'N04',
    framework: 'Problem Theory'
  },
  {
    filePath: 'curriculum/lectures/N05_Domains.pptx',
    displayName: 'N05: Domain-Specific Innovation',
    module: 'Exploration Tools Module',
    topic: 'domain-applications',
    difficulty: 'intermediate',
    lectureNumber: 'N05'
  },
  {
    filePath: 'curriculum/lectures/N06_Portfolio.pptx',
    displayName: 'N06: Portfolio Approach',
    module: 'Portfolio Module',
    topic: 'portfolio-management',
    difficulty: 'advanced',
    lectureNumber: 'N06',
    framework: 'Three Box Solution'
  },
  {
    filePath: 'curriculum/lectures/N07_Well-Defined.pptx',
    displayName: 'N07: Well-Defined Problems',
    module: 'Execution Tools Module',
    topic: 'well-defined-problems',
    difficulty: 'intermediate',
    lectureNumber: 'N07'
  },
  {
    filePath: 'curriculum/lectures/N08_Prior Art.pptx',
    displayName: 'N08: Prior Art and Research',
    module: 'Execution Tools Module',
    topic: 'research-methods',
    difficulty: 'advanced',
    lectureNumber: 'N08'
  },
  {
    filePath: 'curriculum/lectures/N08b_Technical Plan.pptx',
    displayName: 'N08b: Technical Planning',
    module: 'Execution Tools Module',
    topic: 'technical-planning',
    difficulty: 'advanced',
    lectureNumber: 'N08b'
  },
  {
    filePath: 'curriculum/lectures/N09_Term Report.pptx',
    displayName: 'N09: Project Documentation',
    module: 'Capstone Module',
    topic: 'documentation',
    difficulty: 'advanced',
    lectureNumber: 'N09'
  },
  {
    filePath: 'curriculum/lectures/N10_January Term.pptx',
    displayName: 'N10: Capstone Project',
    module: 'Capstone Module',
    topic: 'capstone-project',
    difficulty: 'advanced',
    lectureNumber: 'N10'
  },

  // Supporting Materials
  {
    filePath: 'curriculum/lectures/I&E Lecture Notes Fall.docx',
    displayName: 'Innovation & Entrepreneurship Comprehensive Notes',
    module: 'Introduction Module',
    topic: 'comprehensive-overview',
    difficulty: 'foundational'
  },

  // Structured Data & Frameworks
  {
    filePath: 'curriculum/data/PWS_INNOVATION_BOOK.txt',
    displayName: 'PWS Innovation Methodology Book',
    module: 'Introduction Module',
    topic: 'innovation-fundamentals',
    difficulty: 'foundational',
    framework: 'Problem Types Model'
  },
  {
    filePath: 'curriculum/data/Extended Research Foun.txt',
    displayName: 'Extended Research Foundation',
    module: 'Introduction Module',
    topic: 'theoretical-foundation',
    difficulty: 'foundational',
    framework: 'Multiple Frameworks'
  },

  // Course Structure
  {
    filePath: 'curriculum/docs/Syllabouse.pdf',
    displayName: 'Course Syllabus',
    module: 'Introduction Module',
    topic: 'course-structure',
    difficulty: 'foundational'
  },

  // Reference Books (Examples - add your actual file paths)
  {
    filePath: 'curriculum/books/A More Beautiful Question.pdf',
    displayName: 'A More Beautiful Question (Warren Berger)',
    module: 'Exploration Tools Module',
    topic: 'question-frameworks',
    difficulty: 'intermediate',
    framework: 'Question-Driven Innovation'
  }
];

async function main() {
  try {
    logger.info('🚀 Starting PWS Curriculum Upload');

    const fileSearchService = getPWSFileSearchService();

    // Check if store exists, create if not
    let storeName = process.env.PWS_FILE_SEARCH_STORE_NAME;

    if (!storeName) {
      logger.info('Creating new File Search store...');
      storeName = await fileSearchService.createFileSearchStore('PWS Curriculum Store');
      logger.info(`✅ Store created: ${storeName}`);
      logger.info(`📝 Add this to your .env file: PWS_FILE_SEARCH_STORE_NAME=${storeName}`);
      fileSearchService.setFileSearchStoreName(storeName);
    } else {
      logger.info(`Using existing store: ${storeName}`);
    }

    // Upload each file
    let successCount = 0;
    let errorCount = 0;

    for (const file of CURRICULUM_MATERIALS) {
      try {
        // Check if file exists
        if (!fs.existsSync(file.filePath)) {
          logger.warn(`⚠️  File not found: ${file.filePath} - Skipping`);
          errorCount++;
          continue;
        }

        logger.info(`\n📤 Uploading: ${file.displayName}`);

        await fileSearchService.uploadToFileSearchStore(file.filePath, {
          displayName: file.displayName,
          module: file.module,
          topic: file.topic,
          difficulty: file.difficulty,
          framework: file.framework,
          lectureNumber: file.lectureNumber
        });

        successCount++;
        logger.info(`✅ Uploaded: ${file.displayName}`);
      } catch (error) {
        errorCount++;
        logger.error(`❌ Failed to upload ${file.displayName}:`, error);
      }
    }

    logger.info('\n📊 Upload Summary:');
    logger.info(`   ✅ Successful: ${successCount}`);
    logger.info(`   ❌ Failed: ${errorCount}`);
    logger.info(`   📁 Total: ${CURRICULUM_MATERIALS.length}`);

    logger.info('\n🎉 PWS Curriculum Upload Complete!');
    logger.info(`\n📚 File Search Store: ${storeName}`);
    logger.info('💡 The assistant is now ready to answer questions about the curriculum.');
  } catch (error) {
    logger.error('❌ Upload script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('Fatal error:', error);
      process.exit(1);
    });
}

export { main as uploadPWSCurriculum, CURRICULUM_MATERIALS };
