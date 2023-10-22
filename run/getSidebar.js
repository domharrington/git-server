const NodeGit = require("../lib/nodegit");

module.exports = async (repo, branch, data) => {
  async function listFilesInRepo() {
    const repository = await NodeGit.Repository.openBare(repo);
    //const headCommit = await repository.getHeadCommit();

    const refNames = await repository.getReferenceNames();
    console.log(refNames);

    // Iterate over the reference names
    for (const refName of refNames) {
      console.log(refName);
    }

    const references = await NodeGit.Reference.list(repository);

    const refName = `refs/heads/${branch || "main"}`;

    const ref = await NodeGit.Reference.nameToId(repository, refName);
    const commit = await repository.getCommit(ref);

    const tree = await commit.getTree();


    function convertToSidebar(paths) {
      let result = paths.reduce((res, path) => {
        const splitPath = path.split("/");
        let currentLevel = res;

        for (let i = 0; i < splitPath.length; i++) {
          if (i === splitPath.length - 1) {
            // File level, push the file
            if (splitPath[i - 1]) {
              if (!Array.isArray(currentLevel[splitPath[i - 1]])) {
                currentLevel[splitPath[i - 1]] = [];
              }
              currentLevel[splitPath[i - 1]].push(splitPath[i]);
            }
          } else {
            // Directory level, create an object if it doesn't exist
            if (!currentLevel[splitPath[i]]) {
              currentLevel[splitPath[i]] = {};
            }
            currentLevel = currentLevel[splitPath[i]];
          }
        }

        return res;
      }, {});
      return result;
    }

    return new Promise((resolve, reject) => {
      const filePaths = [];
      const walker = tree.walk(true);
      walker.on("entry", (entry) => filePaths.push(entry.path()));
      walker.on("end", () => resolve(convertToSidebar(filePaths)));
      walker.on("error", reject);
      walker.start();
    });
  }

  try {
    const out = await listFilesInRepo();
    return out;
  } catch (e) {
    console.log(e);
  }
};
