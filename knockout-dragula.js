'use strict';

import ko from 'knockout';
import dragula from 'dragula';

const FOREACH_OPTIONS_PROPERTIES = ['afterAdd', 'afterRender', 'as', 'beforeRemove', 'includeDestroyed'];
const LIST_KEY = 'ko_dragula_list';
let groups = {};

ko.bindingHandlers.dragula = {
  init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
    let options = ko.utils.unwrapObservable(valueAccessor()) || {};
    let foreachOptions = makeForeachOptions(valueAccessor);

    ko.utils.domData.set(element, LIST_KEY, foreachOptions.data);

    ko.bindingHandlers.foreach.init(element, () => foreachOptions, allBindings, viewModel, bindingContext);

    if (options.group) {
      createOrUpdateDrakeGroup(element, options.group);
    } else {
      let drake = createDrake(element);
      ko.utils.domNodeDisposal.addDisposeCallback(element, () => { drake.destroy(); });
    }

    return {
      controlsDescendantBindings: true
    };
  },
  update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
    let foreachOptions = makeForeachOptions(valueAccessor);

    ko.utils.domData.set(element, LIST_KEY, foreachOptions.data);

    ko.bindingHandlers.foreach.update(element, () => foreachOptions, allBindings, viewModel, bindingContext);
  }
};

function makeForeachOptions(valueAccessor) {
  let options = ko.utils.unwrapObservable(valueAccessor()) || {};
  let templateOptions = {
    data: options.data || valueAccessor()
  };

  FOREACH_OPTIONS_PROPERTIES.forEach(function(option) {
    if (options.hasOwnProperty(option)) {
      templateOptions[option] = options[option];
    }
  });

  return templateOptions;
}

function createOrUpdateDrakeGroup(element, groupName) {
  let drake = groups[groupName];
  if (drake) {
    drake.containers.push(element);
  } else {
    drake = groups[groupName] = createDrake(element);
  }

  ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
    let index = drake.containers.indexOf(element);
    drake.containers.splice(index, 1);

    if (!drake.containers.length) {
      drake.destroy();
      groups[groupName] = null;
    }
  });
}

function createDrake(element) {
  let drake = dragula([element]);
  drake.on('drop', onDrop);

  return drake;
}

function onDrop(el, target, source) {
  let item = ko.dataFor(el);
  let sourceItems = ko.utils.domData.get(source, LIST_KEY);
  let sourceIndex = sourceItems.indexOf(item);
  let targetItems = ko.utils.domData.get(target, LIST_KEY);
  let targetIndex = Array.prototype.indexOf.call(target.children, el);

  el.remove();
  sourceItems.splice(sourceIndex, 1);
  targetItems.splice(targetIndex, 0, item);
}
