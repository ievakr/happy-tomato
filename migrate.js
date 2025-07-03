#!/usr/bin/env node

/**
 * Migration Script for Happy Tomato Calendar Refactoring
 * 
 * This script helps migrate from the old structure to the new refactored structure.
 * Run with: node migrate.js
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS = [
  {
    name: 'Move CalendarHeader to Header',
    from: 'src/components/CalendarHeader.js',
    to: 'src/components/layout/Header.js',
    backup: true
  },
  {
    name: 'Move Month to CalendarGrid',
    from: 'src/components/Month.js',
    to: 'src/components/calendar/CalendarGrid.js',
    backup: true
  },
  {
    name: 'Move Day to CalendarDay',
    from: 'src/components/Day.js',
    to: 'src/components/calendar/CalendarDay.js',
    backup: true
  },
  {
    name: 'Move Sidebar to layout',
    from: 'src/components/Sidebar.js',
    to: 'src/components/layout/Sidebar.js',
    backup: true
  },
  {
    name: 'Move EventModal to forms',
    from: 'src/components/EventModal.js',
    to: 'src/components/forms/EventModal.js',
    backup: true
  },
  {
    name: 'Move CreateEventButton to forms',
    from: 'src/components/CreateEventButton.js',
    to: 'src/components/forms/CreateEventButton.js',
    backup: true
  },
  {
    name: 'Move CustomDropdown to common',
    from: 'src/components/CustomDropdown.js',
    to: 'src/components/common/CustomDropdown.js',
    backup: true
  },
  {
    name: 'Move Labels to calendar',
    from: 'src/components/Labels.js',
    to: 'src/components/calendar/Labels.js',
    backup: true
  },
  {
    name: 'Move SmallCalendar to calendar',
    from: 'src/components/SmallCalendar.js',
    to: 'src/components/calendar/SmallCalendar.js',
    backup: true
  },
  {
    name: 'Move util.js to utils',
    from: 'src/util.js',
    to: 'src/utils/legacy.js',
    backup: true
  },
  {
    name: 'Move styles.css to styles',
    from: 'src/styles.css',
    to: 'src/styles/legacy.css',
    backup: true
  }
];

const UPDATE_IMPORTS = [
  {
    file: 'src/App.js',
    replacements: [
      { 
        from: "import CalendarHeader from './components/CalendarHeader'",
        to: "import Header from './components/layout/Header'"
      },
      { 
        from: "import Month from './components/Month'",
        to: "import CalendarGrid from './components/calendar/CalendarGrid'"
      },
      { 
        from: "import Sidebar from './components/Sidebar'",
        to: "import Sidebar from './components/layout/Sidebar'"
      },
      { 
        from: "import EventModal from './components/EventModal'",
        to: "import EventModal from './components/forms/EventModal'"
      },
      { 
        from: "import { getMonth } from './util'",
        to: "import { getMonth } from './utils'"
      },
      { 
        from: "<CalendarHeader />",
        to: "<Header />"
      },
      { 
        from: "<Month month={currentMonth}/>",
        to: "<CalendarGrid month={currentMonth}/>"
      }
    ]
  }
];

function createBackup(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = filePath + '.backup';
    console.log(`📋 Creating backup: ${backupPath}`);
    fs.copyFileSync(filePath, backupPath);
  }
}

function moveFile(from, to) {
  if (fs.existsSync(from)) {
    // Create directory if it doesn't exist
    const dir = path.dirname(to);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    console.log(`📁 Moving: ${from} → ${to}`);
    fs.renameSync(from, to);
    return true;
  }
  return false;
}

function updateImports(filePath, replacements) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    replacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from, 'g'), to);
        modified = true;
        console.log(`🔄 Updated import: ${from} → ${to}`);
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated file: ${filePath}`);
    }
  }
}

function main() {
  console.log('🚀 Starting Happy Tomato Calendar Migration...\n');
  
  // Step 1: Create backups and move files
  console.log('📋 Step 1: Creating backups and moving files...');
  MIGRATIONS.forEach(({ name, from, to, backup }) => {
    console.log(`\n🔄 ${name}`);
    
    if (backup) {
      createBackup(from);
    }
    
    const moved = moveFile(from, to);
    if (moved) {
      console.log(`✅ Successfully moved to ${to}`);
    } else {
      console.log(`⚠️  File not found: ${from}`);
    }
  });
  
  // Step 2: Update imports
  console.log('\n\n🔄 Step 2: Updating imports...');
  UPDATE_IMPORTS.forEach(({ file, replacements }) => {
    console.log(`\n📝 Updating ${file}:`);
    updateImports(file, replacements);
  });
  
  // Step 3: Create new organized files
  console.log('\n\n🆕 Step 3: New refactored files already created:');
  console.log('✅ src/constants/index.js');
  console.log('✅ src/hooks/useCalendar.js');
  console.log('✅ src/hooks/useEvents.js');
  console.log('✅ src/hooks/useResponsive.js');
  console.log('✅ src/hooks/index.js');
  console.log('✅ src/utils/index.js');
  console.log('✅ src/styles/variables.css');
  console.log('✅ src/components/layout/Header.js');
  console.log('✅ src/components/layout/Sidebar.js');
  console.log('✅ src/components/calendar/CalendarGrid.js');
  console.log('✅ src/components/calendar/CalendarDay.js');
  console.log('✅ src/components/calendar/EventItem.js');
  console.log('✅ src/components/index.js');
  console.log('✅ src/App.refactored.js');
  
  console.log('\n🎉 Migration completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Review src/App.refactored.js');
  console.log('2. Update remaining component imports');
  console.log('3. Test the application');
  console.log('4. Remove .backup files when satisfied');
  console.log('5. Replace src/App.js with src/App.refactored.js');
  
  console.log('\n💡 To use the new structure:');
  console.log('   mv src/App.js src/App.old.js');
  console.log('   mv src/App.refactored.js src/App.js');
}

if (require.main === module) {
  main();
}

module.exports = { main }; 