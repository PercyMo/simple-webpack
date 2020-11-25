const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { transformFromAst } = require('@babel/core');

class Webpack {
  constructor(options) {
    const { entry, output } = options
    this.entry = entry // ./src/index.js
    this.output = output // ./dist/main.js

    this.modules = []
  }
  run() {
    const data = this.parse(this.entry)
    
    // 收集所有依赖模块
    this.modules.push(data)
    for (let i = 0; i < this.modules.length; i++) {
      const { dependencies } = this.modules[i]
      if (dependencies) {
        for (let j in dependencies) {
          this.modules.push(this.parse(dependencies[j]))
        }
      }
    }

    // 生成依赖图谱
    const graph = {}
    this.modules.forEach(module => {
      graph[module.entryFile] = {
        dependencies: module.dependencies,
        code: module.code
      }
    })
    this.file(graph)
  }

  // 分析入口模块内容
  parse(entryFile) {
    const content = fs.readFileSync(entryFile, 'utf-8')

    // 将内容通过 parser 抽象成语法树，便于分析、提取
    const ast = parser.parse(content, {
      sourceType: 'module'
    })

    const dependencies = {}
    traverse(ast, {
      ImportDeclaration: function({ node }) {
        const dirname = path.dirname(entryFile)
        const newFile = './' + path.join(dirname, node.source.value)
        dependencies[node.source.value] = newFile
      }
    })

    // 处理内容，转成 AST
    const { code } = transformFromAst(ast, null, {
      presets: ['@babel/preset-env']
    })

    // 返回依赖及babel编译后的源码
    return {
      entryFile,
      dependencies,
      code
    }
  }

  // 生成bundle.js 
  file(code) {
    const filePath = path.join(this.output.path, this.output.filename)
    const newCode = JSON.stringify(code)
    const bundle = `(function(modules) {
      function require(module) {
        function localRequire(relativePath) {
          return require(modules[module].dependencies[relativePath])
        }

        var exports = {};
        (function(code, require, exports) {
          eval(code)
        })(modules[module].code, localRequire, exports)

        return exports
      }
      require('${this.entry}')
    })(${newCode})`
    fs.writeFileSync(filePath, bundle, 'utf-8')
  }
}

module.exports = Webpack;
