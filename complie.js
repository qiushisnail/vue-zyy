//扫描模板中所有依赖， 创建更新函数和watcher
class Compile {
  // el是宿主元素或者是其选择器，
  // vm当前vue实例
  constructor(el, vm) {
    this.$vm = vm;
    this.$el = document.querySelector(el); // 默认是选择器

    if (this.$el) {
      // 将dom节点转换为Fragment提高执行效率
      this.$fragment = this.node2Fragment(this.$el);
      // 执行编译
      this.compile(this.$fragment);
      // 将生产的结果追加至宿主元素中
      this.$el.appendChild(this.$fragment);
    }
  }

  node2Fragment(el) {
    // 创建一个新的Fragment
    const fragment = document.createDocumentFragment();
    let child;
    // 将原生节点拷贝至frament
    while (child = el.firstChild) {
      // appendChild是移动操作
      fragment.appendChild(child);
    }
    return fragment;
  }

  // 编译指定片段
  compile(el) {
    let childNodes = el.childNodes;
    Array.from(childNodes).forEach(node => {
      // 判断node类型，做相应处理
      if (this.isElementNode(node)) {
        // 元素节点要识别k-xx或者@xx
        this.complieElement(node);
      } else if (this.isTextNode(node)
        && /\{\{(.*)\}\}/.test(node.textContent)) {
        // 文本节点 只关系{{xx}}格式
        this.compileText(node, RegExp.$1); // RegExp.$1匹配的内容
      }
      // 遍历可能存在的子节点
      if (node.childNodes && node.childNodes.length) {
        this.compile(node);
      }
    })
  }

  // 编译元素节点
  complieElement(node) {
    console.log('编译元素节点')
    // <div z-text='text' @click='onClick'>
    const attrs = node.attributes;
    Array.from(attrs).forEach(attr => {
      // 规定指令 z-xxx
      const attrName = attr.name; // 属性名
      const exp = attr.value; // 属性值
      if (this.isDirective(attrName)) {// 指令
        const dir = attrName.substr(2);
        this[dir] && this[dir](node, this.$vm, exp);
      } else if (this.isEventDirective(attrName)) { //事件
        const dir = attrName.substr(1); // click
        this.eventHandler(node, this.$vm, exp, dir);
      }
    })
  }

  // 
  compileText(node, exp) {
    //console.log('编译文本节点')
    this.text(node, this.$vm, exp);
  }

  isElementNode(node) {
    return node.nodeType == 1; // 元素节点
  }

  isTextNode(node) {
    return node.nodeType == 3;// 文本节点
  }

  isDirective(attr) {
    return attr.indexOf('z-') == 0;
  }

  isEventDirective(attr) {
    return attr.indexOf('@') == 0;
  }

  // 文本的更新
  text(node, vm, exp) {
    this.update(node, vm, exp, 'text');
  }

  // 处理html
  html(node, vm, exp) {
    this.update(node, vm, exp, 'html');
  }

  // 双向绑定
  model(node, vm, exp) {
    this.update(node, vm, exp, 'model');

    let val = vm.exp;
    // 双绑还要处理视图对模型的更新
    node.addEventListener('input', e => {
      vm[exp] = e.target.value;
      // val = e.target.value;
    })
  }

  // 更新
  update(node, vm, exp, dir) {
    let updaterFn = this[dir + 'Updater'];
    updaterFn && updaterFn(node, vm[exp]); // 执行更新，get
    new Watcher(vm, exp, function (value) {
      updaterFn && updaterFn(node, value);
    })
  }

  textUpdater(node, value) {
    node.textContent = value;
  }

  htmlUpdater(node, value) {
    node.innerHTML = value;
  }

  modelUpdater(node, value) {
    node.value = value;
  }

  eventHandler(node, vm, exp, dir) {
    let fn = vm.$options.methods && vm.$options.methods[exp];
    if (dir && fn) {
      node.addEventListener(dir, fn.bind(vm), false); // 参数三是否启用捕获
    }
  }
}