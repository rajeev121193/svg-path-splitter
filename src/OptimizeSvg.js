import {PathSplitter} from "./PathSplitter";

export function OptimizeSvg(inputFileUrl, outputFileSetter, imageDimensSetter) {
    var request = new XMLHttpRequest();
    request.open("GET", inputFileUrl);
    request.setRequestHeader("Content-Type", "image/svg+xml");
    request.addEventListener("load", function (event) {
        var response = event.target.responseText;
        var doc = new DOMParser();
        var xml = doc.parseFromString(response, "image/svg+xml");

        imageDimensSetter(xml.width, xml.height);

        //This is to convert HTML collection to JS Array
        const allPaths = [...xml.getElementsByTagName("path")];
        const oldPathToNewPathsMap = {};
        allPaths.forEach((path, index) => {
            const parentNode = path.parentNode;
            const newPathNodes = [];
            PathSplitter(path.getAttribute("d")).forEach(pathDataPart => {
                const newPath = path.cloneNode(true);
                newPath.setAttribute("d", pathDataPart);
                newPathNodes.push(newPath);
            });

            // Track all paths to be deleted and added for each parent
            const existingData = oldPathToNewPathsMap[parentNode.toString()];
            if (existingData) {
                oldPathToNewPathsMap[parentNode.toString()] = {
                    parentNode,
                    oldPathNodes: [...existingData.oldPathNodes, path],
                    newPathNodes: [
                        ...existingData.newPathNodes,
                        ...newPathNodes
                    ]
                };
            } else {
                oldPathToNewPathsMap[parentNode.toString()] = {
                    parentNode,
                    oldPathNodes: [path],
                    newPathNodes: newPathNodes
                };
            }
        });

        // Delete all the old paths and add all the new paths for each parent
        Object.keys(oldPathToNewPathsMap).forEach(parentNodeKey => {
            const {
                parentNode,
                oldPathNodes,
                newPathNodes
            } = oldPathToNewPathsMap[parentNodeKey];
            oldPathNodes.forEach(oldPath => parentNode.removeChild(oldPath));
            newPathNodes.forEach(newPath => parentNode.appendChild(newPath));
        });

        //Convert the new XML document to svg string
        var svgData = new XMLSerializer().serializeToString(xml);
        outputFileSetter(svgData);
    });
    return request.send();
}
