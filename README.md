# Assignments, but Automated
An automated way of grabbing Canvas assignments and posting them to a Notion database

<img src="readme-images/full-database.PNG" alt="full database" width="500"/>

## :crystal_ball: How it Works
1. Every time the script is run, up to `100` assignments from Canvas will be cleared
   - Assignments from Canvas are marked with the `~` symbol
   - If you wish to add a new assignment that will not be cleared, do not include `~` in the title
   - If your database contains over `100` assignments, you will have to manually remove items to avoid duplicate assingments
2. After clearing, the first `45` assignments from each listed course are uploaded to the database
   - Items that do not have due dates will not be listed in the database
   - Items whose due date have already passed will not be listed
   - All due dates will be listed in Eastern Time Zone (ET)
     - If you would like other time zones, send me an email at ryan7mcpherson@gmail.com
3. When a new semester starts, all you have to do is update the course tags in the database and change the courses' Canvas ids in the `.env`

## :cyclone: Getting Started
### Cloning the Repository
Begin by cloning the repositry. A tutorial can be found [here](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)
### Creating the Notion Database
1. This tutorial will assume you have working knowledge of making tables in Notion. If not, a tutorial can be found [here](https://www.keepproductive.com/blog/notion-tables)
2. Create a new Notion page and select "table" under "database"
3. Create a table with 3 columns, each for the name, date, and course, respectfully
   1. Give the name column a `property type` of `title`
   2. Give the date column a `property type` of `date`
   3. Give the course column a `property type` of `multi-select`
      1. Create a new tag for each course you're taking
         > The tag names will be the 1st 7 characters of the course's name on Canvas. If the course name on Canvas is "COP3530 - DSA Fall 2021", then the tag name will be                    "COP3530"
4. If done correctly, your database should look something like this:
<img src="readme-images/empty-database.PNG" alt="empty database" width="400"/>


### Configuring the Environment File
1. The `.env` file holds all necessary variables for the script to run properly
2. The next few sections will show you how to aquire each variable's value 
3. For now, open the included `.env` file and have it off to the side 
4. The variable's name and corresponding value is as follows: 

| Variable Name | Value |
| ------------- | ----- |
|CANVAS_ORGANIZATION_TITLE|your organization's version of Instructure|
|CANVAS_API_KEY|your API key genearted for your Canvas account|
|COURSE_ID_LIST|list of canvas course ID's, each seperated by a comma|
|NOTION_API_KEY|the API key genearted for your Notion account|
|NOTION_DATABASE_ID|your database's specific ID|
|NOTION_NAME_ID|the EXACT name of your title column|
|NOTION_DATE_ID|the EXACT name of your date column|
|NOTION_MULTI_ID|the EXACT name of your course column|

#### Canvas Variables
1. The orgainzation title can be found by logging in to your Canvas account and inspecting the URL. The hightlighted portion is the value of `CANVAS_ORGANIZATION_TITLE` in the `.env` file
<img src="readme-images/organization-title-url.PNG" alt="orgainization title URL" width="300"/>

2. The Canvas API key can be generated by logging on to your Canvas and clicking Account -> Settings -> scroll down to "Approved Integrations" -> click on "New Access Token" -> Generate Token. The token is the long string of characters under the "Token" section. This is the value of `CANVAS_API_KEY` in the `.env` file

3. The course Id's can be found by visiting each course's homepage and inspecting the URL. The highlighted portion is the class's Canvas course Id. Do this for every class and write out each value sperated by a comma in `COURSE_ID_LIST` in the `.env` file
<img src="readme-images/course-id-url.PNG" alt="course id URL" width="400"/>


#### Notion Variables
1. The Notion API key can be generated by going [here](https://www.notion.so/my-integrations) and clicking on "Create new integration" -> Submit. The API key is the Internal Integration Token under the "Secrets" header. Click on "Show" and copy this value into `NOTION_API_KEY` in the `.env` file

2. We now must connect your created integration to your database. On your Notion database page, in the upper right, click on Share -> Invite -> under "select an integration" choose the name of the integration you created to generate your API key -> Invite 

3. The Notion database Id can be found by inspecting the URL of your Notion database. For this step, you will have to use Notion's web browser version. The hightlighted portion is your database's Id (the portion after "notion.so/" and before the "?"). This is the value of `NOTION_DATABASE_ID` in the `.env` file
<img src="readme-images/database-id-url.PNG" alt="database id URL" width="600"/>

4. The name of your title column is the value of `NOTION_NAME_ID` in the `.env` file

5. The name of your date column is the value of `NOTION_DATE_ID` in the `.env` file

6. The name of your multi-select (course) column is the value of `NOTION_MULTI_ID` in the `.env` file

After completion, your `.env` file should look something like this:
```
CANVAS_ORGANIZATION_TITLE = ufl
CANVAS_API_KEY = XXXX~XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
COURSE_ID_LIST = 436423,123456,654321

NOTION_API_KEY = secret_XXXXXXXXXXXXXXXXXXXXXXXXXX
NOTION_DATABASE_ID = b0c43536536f4b28920d164bba7f699a
NOTION_NAME_ID = Name
NOTION_DATE_ID = Due By
NOTION_MULTI_ID = Class
```
:tada: Congratz! Everything should be setup to run properly

## :rocket: Running the Script
1. We will be running the script uisng Node.js. You can download it [here](https://nodejs.org/en/download/)
2. Navigate to the folder containing the script.js file and run the command:
```
node script.js
```
- This will take a few seconds depending on your internet connection and number of assignments
     > You must be connected to the internet
