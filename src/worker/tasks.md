- on WorkspaceDir changed or opened
  - send workspace folder
    - keep list of workspace folders

  - read all files and keep metadata about them

- on delete/create
  - keep the changed paths
  - wait until idle for ... ms
    - order by path asc
      - get topmost dir
        - reprocess