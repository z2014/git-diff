const fs = require('fs')
const readline = require('readline');

const preCommit = './pre-commit.js';
const currentCommit = './current-commit.js';

const readFileToArr = async (filename) => {
    return new Promise((resolve, reject) => {
        const fRead = fs.createReadStream(filename);
        const objReadline = readline.createInterface({
            input:fRead
        });
        const arr = [];
        objReadline.on('line',function (line) {
            arr.push(line);
        });
        objReadline.on('close',function () {
            resolve(arr);
        });
    })
}

const shortestDiff = (src, dest) => {
    // 源文件的长度
    const sLen = src.length;
    // 目标文件的长度
    const dLen = dest.length;
    // 最大迭代的长度
    const max = sLen + dLen;
    // 迭代存储的字典
    const dMap = [];
    // 声明当前src和dest移动位置的指针
    let x, y;
    for (let d = 0;d < max; d++) {
        const kMap = {};
        if (d === 0) {
            // 初始化判断是否有move元素
            let t = 0;
            while (sLen > t && dLen > t && src[t] === dest[t]) {
                t++
            }
            dMap[0] = {
                0: t
            }
            continue;
        }
        for (let k = -d;k <= d;k += 2) {
            const lastV = dMap[d - 1];
            if (k === -d || (k !== d && lastV[k - 1] < lastV[k + 1])) {
                 // 向下
                x = lastV[k + 1];
            } else {
                // 向右
                x = lastV[k - 1] + 1;
            }
            y = x - k;
            while (x < sLen && y < dLen && src[x] === dest[y]) {
                // 如果是相同字符串，那么往后跳一格
                x = x + 1;
                y = y + 1;
            }
            kMap[k] = x;
            // 如果当前已经删除完原有string && 添加后新增string， 结束循环
            if (x === sLen && y === dLen) {
                dMap.push(kMap);
                return dMap;
            }
        }
        dMap.push(kMap);
    }
    return dMap
}

const ACTION = {
    MOVE: 'MOVE',
    INSERT: 'INSERT',
    DEELTE: 'DELETE'
}
const getAction = (dMap, src, dest) => {
    const actions = [];
    let prevX, prevY, prevK;
    let x = src.length;
    let y = dest.length;
    for (let d = dMap.length - 1; d > 0; d--) {
        k = x - y;
        lastV = dMap[d - 1];
        if (k === -d || k !==  d && (lastV[k - 1] < lastV[k + 1])) {
            prevK = k + 1;
        } else {
            prevK = k - 1;
        }
        prevX = lastV[prevK];
        prevY = prevX - prevK;
        while (x > prevX && y > prevY) {
            actions.push(ACTION.MOVE);
            x = x - 1;
            y = y - 1;
        }
        if (x === prevX) {
            actions.push(ACTION.INSERT);
        } else {
            actions.push(ACTION.DEELTE);
        }
        x = prevX;
        y = prevY;
    }
    if (dMap[0][0] !== 0) {
        // 将初始化的move添加进去
        for (let i = 0;i < dMap[0][0]; i++) {
            actions.push(ACTION.MOVE)
        }
    }
    return actions.reverse()
}

const getDiff = (actions, src, dest) => {
    let srcIndex = 0;
    let destIndex = 0;
    actions.map(action => {
        switch (action) {
            case ACTION.MOVE:
                console.log('\x1B[37m', src[srcIndex]);
                srcIndex ++;
                destIndex ++;
                break;
            case ACTION.INSERT:
                console.log('\x1B[32m', dest[destIndex]);
                destIndex ++;
                break;
            case ACTION.DEELTE:
                console.log('\x1B[31m', src[srcIndex]);
                srcIndex ++;
                break;
        }
    })
}
const main = async () => {
    const src = await readFileToArr(preCommit);
    const dest = await readFileToArr(currentCommit);
    let actions
    if (src.length === 0) {
        actions = Array(dest.length).fill(ACTION.INSERT);
    } else if (dest.length === 0) {
        actions = Array(src.length).fill(ACTION.DEELTE);
    } else {
        const dMap = shortestDiff(src, dest);
        actions = getAction(dMap, src, dest);
    }
    getDiff(actions, src, dest);
}

main()
