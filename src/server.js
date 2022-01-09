import cron from 'node-cron';
import config from 'config';
import AssignmentPopulator from './assignmentPopulator.js';

const serverConfig = config.get('server');

const getDate = () => new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

cron.schedule(`* */${serverConfig.frequency} * * *`, () => {
    const assignmentPopulator = new AssignmentPopulator();
    assignmentPopulator.run();
    console.log(`${getDate()} - Executed assignment populator`);
});
