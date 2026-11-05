# AI Usage

## Example Prompt

1. create UnitTest all possibilities of endpoint, use-cases & endpoints into backend/tests and for the package.json test call the folder tests if possible.
2. accumulate the total line code endpoint, use-case and create the unit test line coverage minimum 80% coverage.
3. add each filter on field grid the filter can choose equal, not equal and so on. when change type filter each field change the icon and add icon asc / desc when click header field. bellow field actions add text reset filter which mean reset all the filter.
4. i dont see field action in products menu and when i filled filter each field then call api instead click apply on field actions. so field action only have reset filter but make it like this a href [icon filter] reset.
5. when the data grid is empty or only few data row then i want to change filter field the select list filter become hidden because it depends on height grid, i want to show the select list filter field outside of the grid and whenever i trigger/change filter, type then auto trigger filer api.
6. when set filter field numeric doesnt work it should be called api and when changing rows per page it doesnt trigger call api max item list 10 row if more than 10 then add vertical scroll inside grid. in reports menu set vertical scroll in card sales over time and top producst max 10 items and add pagination filter list not like grid

## Tooling and scope

- Assistant: AI assistant using Copilot SDK in VS Code. The model/version is not recorded here.
- AI assistance was used across the work represented in this repository and conversation, including backend use cases, repositories, endpoints, validation and tests; frontend forms, pages and architecture; request audit metadata; Docker/Compose; OpenAPI documentation; and project notes.
- The requirements came from the user's initiative request and subsequent feature and correction requests. This file is a summary, not a verbatim transcript of every prompt.

## Review and verification

AI-generated changes are working drafts. The repository owner should inspect the final diff, verify business and security behavior, run the application against PostgreSQL, and be able to explain each design decision before submission.

For the Docker and documentation update, the Compose configuration and both container image builds were checked, and the backend and frontend production builds passed. A live Compose stack and PostgreSQL integration/concurrency scenarios were not run as part of that verification.

Update this record if additional AI tools, models, or material assistance are used. Do not attribute work to a model/version unless that information is known.
