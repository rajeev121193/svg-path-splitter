/**
 * Reference - https://gist.github.com/iconifyit/958e7abba71806d663de6c2c273dc0da
 * This script was taken from a discussion on Google Groups.
 * I'm not taking credit for it but sharing it because it is very useful for splitting
 * discontinuous absolute paths into continuous subpaths. Where this is particularly
 * useful is for importing SVG files into applications like Figma, Sketch, InVision, XD, etc.
 */
/**
 * Split discontinuous absolute paths into continuous sub-paths.
 *
 *     Example:
 *
 *     console.log(PathSplitter(
 *         "M.75,17.25a16.5,16.5,0,0,1,27-12.73" +
 *         "m4.88,6.73a16.63,16.63,0,0,1,1.12,6v12a16.5,16.5,0,0,1-16.5,16.5,16.82,16.82,0,0,1-3-.27" +
 *         "M6.75,42a16.49,16.49,0,0,1-6-12.73v-4.5" +
 *         "m24,4.5v-12a7.5,7.5,0,0,0-12-6" +
 *         "m-3,6v12a7.51,7.51,0,0,0,10.5,6.88" +
 *         "-3-17.38v9"
 *     ));
 *
 *     Returns:
 *
 *     [
 *         M 0.75 17.25 a 16.5 16.5 0 0 1 27 -12.73,
 *         M 32.63 11.25 a 16.63 16.63 0 0 1 1.12 6 v 12 a 16.5 16.5 0 0 1 -16.5 16.5 a 16.82 16.82 0 0 1 -3 -0.27,
 *         M 6.75 42 a 16.49 16.49 0 0 1 -6 -12.73 v -4.5,
 *         M 24.75 29.27 v -12 a 7.5 7.5 0 0 0 -12 -6,
 *         M 9.75 17.27 v 12 a 7.51 7.51 0 0 0 10.5 6.88,
 *         M 17.25 18.77 v 9
 *     ]
 * @param   {string}    pathData    The SVG path data string.
 * @returns {Array}
 * @constructor
 */
export function PathSplitter(pathData) {
    function paths(ps) {
        var p = (paths.ps = paths.ps || {});
        if (p[ps]) {
            p[ps].sleep = 100;
        } else {
            p[ps] = {
                sleep: 100
            };
        }
        setTimeout(function () {
            for (var key in p)
                if (p.hasOwnProperty(key) && key !== ps) {
                    p[key].sleep--;
                    !p[key].sleep && delete p[key];
                }
        });
        return p[ps];
    }

    function clone(obj) {
        if (typeof obj == "function" || Object(obj) !== obj) {
            return obj;
        }
        var res = new obj.constructor();
        for (var key in obj)
            if (obj.hasOwnProperty(key)) {
                res[key] = clone(obj[key]);
            }
        return res;
    }

    function pathClone(pathArray) {
        var res = clone(pathArray);
        res.toString = toString;
        return res;
    }

    function parsePathString(pathString) {
        if (!pathString) {
            return null;
        }
        var pth = paths(pathString);
        if (pth.arr) {
            return pathClone(pth.arr);
        }

        var paramCounts = {
                a: 7,
                c: 6,
                o: 2,
                h: 1,
                l: 2,
                m: 2,
                r: 4,
                q: 4,
                s: 4,
                t: 2,
                v: 1,
                u: 3,
                z: 0
            },
            data = [];
        if (Array.isArray(pathString) && Array.isArray(pathString[0])) {
            // rough assumption
            data = pathClone(pathString);
        }
        if (!data.length) {
            const pathCommand = /([a-z])[\s,]*((-?\d*\.?\d*(?:e[-+]?\d+)?[\s]*,?[\s]*)+)/gi;
            const pathValues = /(-?\d*\.?\d*(?:e[-+]?\d+)?)[\s]*,?[\s]*/gi;
            String(pathString).replace(pathCommand, function (a, b, c) {
                var params = [],
                    name = b.toLowerCase();
                c.replace(pathValues, function (a, b) {
                    b && params.push(+b);
                });
                if (name === "m" && params.length > 2) {
                    data.push([b].concat(params.splice(0, 2)));
                    name = "l";
                    b = b === "m" ? "l" : "L";
                }
                if (name === "o" && params.length === 1) {
                    data.push([b, params[0]]);
                }
                if (name === "r") {
                    data.push([b].concat(params));
                } else
                    while (params.length >= paramCounts[name]) {
                        data.push(
                            [b].concat(params.splice(0, paramCounts[name]))
                        );
                        if (!paramCounts[name]) {
                            break;
                        }
                    }
            });
        }
        data.toString = paths.toString;
        pth.arr = pathClone(data);
        return data;
    }

    function pathToAbsoluteSubPaths(path_string) {
        var path_commands = parsePathString(path_string),
            end_point = [0, 0],
            sub_paths = [],
            command = [],
            i = 0;

        while (i < path_commands.length) {
            command = path_commands[i];
            end_point = getNextEndPoint(end_point, command);
            if (command[0] === "m") {
                command = ["M", end_point[0], end_point[1]];
            }
            var sub_path = [command.join(" ")];

            i++;

            while (!endSubPath(path_commands, i)) {
                command = path_commands[i];
                sub_path.push(command.join(" "));
                end_point = getNextEndPoint(end_point, command);
                i++;
            }

            sub_paths.push(sub_path.join(" "));
        }

        return sub_paths;
    }

    function getNextEndPoint(end_point, command) {
        var x = end_point[0],
            y = end_point[1];
        if (isRelative(command)) {
            switch (command[0]) {
                case "h":
                    x += command[1];
                    break;
                case "v":
                    y += command[1];
                    break;
                case "z":
                    // back to [0,0]?
                    x = 0;
                    y = 0;
                    break;
                default:
                    x += command[command.length - 2];
                    y += command[command.length - 1];
            }
        } else {
            switch (command[0]) {
                case "H":
                    x = command[1];
                    break;
                case "V":
                    y = command[1];
                    break;
                case "Z":
                    // back to [0,0]?
                    x = 0;
                    y = 0;
                    break;
                default:
                    x = command[command.length - 2];
                    y = command[command.length - 1];
            }
        }
        return [x, y];
    }

    function isRelative(command) {
        return command[0] === command[0].toLowerCase();
    }

    function endSubPath(commands, index) {
        if (index >= commands.length) {
            return true;
        } else {
            return commands[index][0].toLowerCase() === "m";
        }
    }

    return pathToAbsoluteSubPaths(pathData);
}
