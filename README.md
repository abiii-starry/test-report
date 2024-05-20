# test-report
Extract test report data from excel sheet and generate a simple html report

# how to run the project
1. Configure report-conf.js file based on current version information

   **fileName**: Bug file name

   **sheetName**: Sheet name of the target bug
   
   **version**: current Version

   **previousVersion**: previous versions that need to be compared to the current version

2. Put the bug excel into the ./bug-excel
3. Run the following command
   ```
   yarn run generate-report
   ```
