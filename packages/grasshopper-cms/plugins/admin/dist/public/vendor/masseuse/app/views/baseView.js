define([
    'jquery', 'backbone', 'underscore', '../utilities/channels', './viewContext', './lifeCycle',
    '../utilities/accessors', '../utilities/createOptions', '../models/masseuseModel', '../models/proxyProperty',
    '../models/observerProperty'
], function ($, Backbone, _, Channels, ViewContext, lifeCycle, accessors, createOptions, MasseuseModel, ProxyProperty,
    ObserverProperty) {
    'use strict';

    var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events',
        'name', 'appendTo', 'prependTo', 'wrapper'],
        BEFORE_RENDER_DONE = 'beforeRenderDone',
        AFTER_TEMPLATING_DONE = 'afterTemplatingDone',
        RENDER_DONE = 'renderDone',
        AFTER_RENDER_DONE = 'afterRenderDone',
        MODEL_DATA = 'modelData',
        /**
         *
         *
         * The BaseView is a custom extension of Backbone.View with some built in functionality and a defined life
         * cycle. The life
         * cycle methods can be run either synchronously or asynchronously.
         *
         * To initialize a BaseView, there are several choices of options to pass in.
         *
         * The life cycle has three main parts: `beforeRender`, `render`, and `afterRender`. `beforeRender` and
         * `afterRender` are
         * noops by default. If they are defined with zero arguments, they are executed synchronously. If they are
         * defined with
         * one argument, then a `$.Deferred` is passed in as that argument, and the life cycle doesn't continue until
         * that
         * `$.Deferred` is resolved. The render method uses the same convention.
         *
         * ```
         * beforeRender : function() {  synchronous  },
         * beforeRender : function($deferred) {  must resolve or reject $deferred  }
         * ```
         *
         * The lifecycle is started with `view.start()`. This returns a promise. During the life cycle the promise is
         * notifed with:
         * `beforeRenderDone`, `renderDone`, and `afterRenderDone`.
         *
         *     Child views are rendered during a parent views `afterDone`. The views start promise is not resolved until
         *     all the
         *     children's promises are resolved. Children can be nested arbitrariluy deep. Child views can be added
         *     before start using
         * `parent.addChild(child)`.
         *
         *
         * @class A View that adds lifecycle methods to Views that are optionally async using jQuery promises.
         * Adds support for adding child Views
         * @namespace masseuse/BaseView
         * @type {*|extend|extend|extend|void|Object}
         */
        BaseView = Backbone.View.extend({
            constructor : constructor,
            initialize : initialize,
            start : start,
            render : render,
            dataToJSON : dataToJSON,
            bindEventListeners : bindEventListeners,
            remove : remove,
            children : null,
            addChild : addChild,
            addChildren : addChildren,
            removeChild : removeChild,
            refresh : refresh,
            restart : refresh,
            refreshChildren : refreshChildren,
            removeAllChildren : removeAllChildren,
            appendOrInsertView : appendOrInsertView

            // Dynamically created, so the cache is not shared on the prototype:
            // elementCache: elementCache
        });

    BaseView.beforeRenderDone = BEFORE_RENDER_DONE;
    BaseView.afterTemplatingDone = AFTER_TEMPLATING_DONE;
    BaseView.renderDone = RENDER_DONE;
    BaseView.afterRenderDone = AFTER_RENDER_DONE;

    // Share channels among all Views
    BaseView.prototype.channels = BaseView.prototype.channels ||  new Channels();

    return BaseView;

    /**
     * The constructor of BaseView overrides the default BB constructor, so that the options object can be created and
     * applied to `this.el` before `this.initialize` is called.
     *
     * * `name` - convenience name string for debugging - will be available on the view instance
     * `appendTo` - if set and `el` is not set then the view will be appended to this eleeent. `appendTo` can be a
     * sizzle selector, a DOM element, or a jQuery object
     * `bindings` - declarative syntax to setup view listeners
     * array of arrays
     * each sub array contains: what to listen to, the event, and the callback
     * view context is assumed
     *
     * ```javascript
     * bindings : [
     * ['model', 'change:price', 'showNewPrice'],
     * ['model', 'change:discount', 'animateAdvertisement']
     * ],
     * ```
     *
     * * `defaultOptions` - the options to be used as the default. Passed in options will extend this.
     * * `ModelType` - if supplied, `this.model` will be of type `ModelType` - default is `MasseuseModel`
     * * `modelData` - if supplied, `this.model` will be initialized with, `this.model.set(modelData)`
     * * ViewContext - Convenience helper to acces the view context from within modelData
     * * this helps in separating view options and view definitions into separate AMDs
     *
     * ```javascript
     * modelData : {
     *            viewId : ViewContext('cid')
     *        }
     * ```
     *
     * * `template` - String to be used as the umderscore template
     * * `viewOptions` - list of keys for which each key value pair from `options` will be transferred to the view
     * instance
     *
     * ```javascript
     * var view = new BaseView({
     *    name : 'MyName',
     *    appendView : false,
     *    ModelType : MyCustomModel,
     *    modelData : { ... },
     *    bindings : [
     *        ['model', 'change:price', 'showNewPrice'],
     *        ['model', 'change:discount', 'animateAdvertisement']
     *    ],
     *    templateHtml : '<div><%= price %> : <%= discount %></div>',
     *        // Underscore templating that will - if provided - be turned into this.template using
     *        _.template(templateHtml)
     *
     * });
     * ```
     *
     * @method constructor
     * @memberof masseuse/BaseView#
     * @param options
     * @param useDefaultOptions
     */
    function constructor() {
        var options,
            args = Array.prototype.slice.call(arguments, 0),
            length = args.length,
            last = args[length - 1],
            useDefaultOptions = false !== last,
            ViewType;

        // remove optional boolean indicator of wanting to use defaultOptions
        if (length && 'object' !== typeof last) {
            args.pop();
        }

        if (useDefaultOptions && this.defaultOptions) {
            args.unshift(this.defaultOptions);
        }

        options = createOptions.apply(null, args);

        ViewType = options.ViewType;
        if (ViewType) {
            delete options.ViewType;
            return new ViewType(options);
        }

        this.cid = _.uniqueId('view');
        _.extend(this, _.pick(options, viewOptions));
        this._ensureElement();
        this.initialize.call(this, options);
        this.delegateEvents();
    }

    /**
     * @method initialize
     * @memberof masseuse/BaseView#
     * @param options
     */
    function initialize (options) {
        var self = this;

        this.elementCache = _.memoize(elementCache.bind(this));

        if(options) {
            if (options.viewOptions) {
                viewOptions = viewOptions.concat(options.viewOptions);
            }
            _.extend(this, _.pick(options, viewOptions));
        }

        _setTemplate.call(this, options);
        _setModel.call(this, options);
        _setBoundEventListeners.call(this, options);
        if (options && options.plugins && options.plugins.length) {
            _.each(options.plugins, function (plugin) {
                plugin.call(self, options);
            });

        }

        this.children = [];
    }

    /**
     * Wrapper method for lifecycle methods. Life cycle event are notifed both throw the progress returned by this
     * method's promise, and by events triggered on the view. So - for example - plugins can hook into life cycle
     * events.
     *
     * In order, this method:
     * - Calls this.beforeRender()
     * - Starts any child views
     * - Notifies that beforeRender is done
     * - If the view has a parent, waits for its parent to render
     * - Calls this.render()
     * - Notifies that render is done
     * - Calls this.afterRender()
     * - Notifies that afterRender is done
     * - Resolves the returned promise
     *
     * @memberof masseuse/BaseView#
     * @param {jQuery.promise} $parentRenderPromise - If passed in, the start method was called from a parent view
     * start() method.
     * @returns {jQuery.promise} A promise that is resolved when when the start method has completed
     */
    function start ($parentRenderPromise) {
        var self = this,
            $deferred;

        if (this.$startPromise) {
            return this.$startPromise;
        }

        $deferred = new $.Deferred();
        $deferred.done(function() {
            self.hasStarted = true;
        });

        this.$startPromise = $deferred.promise();
        lifeCycle.runAllMethods.call(this, $deferred, $parentRenderPromise);
        return this.$startPromise;
    }

    /**
     * @memberof masseuse/BaseView#
     */
    function render () {
        this.appendOrInsertView(arguments[arguments.length - 1]);
        this.elementCache = _.memoize(elementCache.bind(this));
    }

    /**
     * @memberof masseuse/BaseView#
     * @param $startDeferred
     */
    function appendOrInsertView ($startDeferred) {
        this.appendTo || this.prependTo ? _appendTo.call(this, $startDeferred) : _insertView.call(this, $startDeferred);
    }

    /**
     * And element cache that uses sizzle selectors and the context of the view.
     * @param selector - the sizzle selector to look for and cache
     * @returns {*|Mixed}
     */
    function elementCache (selector) {
        return this.$el.find(selector);
    }

    /**
     * @memberof masseuse/BaseView#
     * @returns {Object|string|*}
     */
    function dataToJSON () {
        return this.model ? this.model.toJSON() : {};
    }

    /**
     * bindEventListeners
     * Bind all event listeners specified in and 'options.listeners' using 'listenTo'. Either `option.bindings` or
     * `options.listeners` can be used.
     *
     * @memberof masseuse/BaseView#
     * @param bindingsArray (Array[Array])  - A collection of arrays of arguments that will be used with
     * 'Backbone.Events.listenTo'
     *
     * @example:
     *      bindEventListeners([['myModel', 'change:something', 'myCallbackFunction']]);
     *
     * @remarks
     * Passing in an array with a string as the first parameter will attempt to bind to this[firstArgument] so that
     * it is possible to listen to view properties that have not yet been instantiated (i.e. viewModels)
     */
    function bindEventListeners (bindingsArray) {
        var self = this;

        this.stopListening();

        bindingsArray = _.map(bindingsArray, function (oneBindingArray) {

            var onListener = 2 === oneBindingArray.length,
                excludedIndex = onListener ? 0 : 1;

            // Since the view config object doesn't have access to the view's context, we must provide it
            _.each(oneBindingArray, function (arg, index) {
                // Leave the second array item as a string
                if (_.isString(arg) && index != excludedIndex) {
                    oneBindingArray[index] = accessors.getProperty(self, arg);
                }
            });

            if (onListener) {
                oneBindingArray.unshift(self);
            }

            return oneBindingArray;
        });

        // TODO: test that duplicate items will pick the bindings from options, throwing out defaults
        bindingsArray = _.uniq(bindingsArray, function (a) {
            return _.identity(a);
        });

        _.each(bindingsArray, function (listenerArgs) {
            self.listenTo.apply(self, listenerArgs);
        });
    }

    /**
     * Removes this view and all its children. Additionally, this view removes itself from its parent view.
     * @memberof masseuse/BaseView#
     */
    function remove () {
        this.removeAllChildren();

        if (this.parent && _.contains(this.parent.children, this)) {
            this.parent.removeChild(this);
        }

        this.trigger('onRemove');


        if (this.model) {
            this.model.off();
            this.model.stopListening();
            delete this.model;
        }

        if (!this.$el) {
            this.$el = $('<div/>');
        }
        Backbone.View.prototype.remove.apply(this, arguments);


        if (this.$el) {
            this.undelegateEvents();
            this.$el.removeData().unbind();
            this.$el.empty();
            delete this.$el;
        }

        if (this.el) {
            delete this.el;
        }
    }

    /**
     * Add multiple child views. The method receives either an array of views to be
     * added or is called with all the views to be added.
     * @memberof masseuse/BaseView#
     * @method
     * @param childView
     */
    function addChildren () {
        var args = _.isArray(arguments[0]) ? arguments[0] : arguments,
            self = this,
            children = [];
        _.each(args, function(child) {
            children.push(self.addChild.call(self, child));
        });
        return children;
    }

    /**
     * Add a child view to the array of this views child view references.
     * The child must be started later. This happens in start or manually.
     *
     * This method can take either a view instance or options for a view.
     *
     * If options for a view are passed in, then BaseView is the default ViewType. The
     * ViewType can be declared on the `options.ViewType`.
     *
     * @memberof masseuse/BaseView#
     * @method
     * @param childView
     */
    function addChild (childView) {
        if (childView instanceof Backbone.View) {
            return _addChildInstance.call(this, childView);
        } else {
            return _addChildInstance.call(this, new BaseView(childView));
        }
    }

    function _addChildInstance (childView) {
        var child;
        if (!_(this.children).contains(childView)) {
            this.children.push(child = childView);
            childView.parent = this;
            if(this.hasStarted && !childView.hasStarted) {
                childView.start();
            }
        }
        return child;
    }

    /**
     * Remove one child from the parentView.
     * @memberof masseuse/BaseView#
     * @param childView
     */
    function removeChild (childView) {
        // TODO: increase efficiency here
        this.children = _(this.children).without(childView);
        childView.remove();
    }

    /**
     * Remove all children from the parentView.
     * @memberof masseuse/BaseView#
     */
    function removeAllChildren () {
        _(this.children).each(this.removeChild.bind(this));
    }

    /**
     * Remove this view and all its children. Then restart them all.
     * @memberof masseuse/BaseView#
     * @returns {$promise}
     */
    function refresh () {
        if (this.hasStarted) {
            Backbone.View.prototype.remove.apply(this);
            delete this.hasStarted;
            delete this.$startPromise;
        }
        return this.start();
    }

    /**
     * Remove all children and restart them.
     * @memberof masseuse/BaseView#
     * @returns $promise - will be resolved once all children are restarted
     */
    function refreshChildren () {
        var $deferred = new $.Deferred(),
            childPromiseArray = [];

        _(this.children).each(function (child) {
            childPromiseArray.push(child.refresh());
        });

        $.when.apply($, childPromiseArray).then($deferred.resolve);

        return $deferred.promise();
    }

    /**
     * Private Methods - must be supplied with context
     * @private
     */

    function _appendTo ($startDeferred) {
        var template = this.template,
            $newEl,
            wrapper = this.wrapper !== false;

        template = template ? template(this.dataToJSON()) : '';

        $newEl = wrapper ? this.el : $(template);
        // More than 1 root level element and no wrapper leads to this.el being incorrect.
        if (!wrapper && 1 === $newEl.length) {
            this.setElement($newEl);
        } else {
            this.$el.html(template);
        }

        $startDeferred && $startDeferred.notify && $startDeferred.notify(AFTER_TEMPLATING_DONE);

        if (this.appendTo) {
            _addViewElement.call(this, 'appendTo');
        } else if (this.prependTo) {
            _addViewElement.call(this, 'prependTo');
        }
    }

    function _addViewElement (action) {
        if (this.parent && _.isString(this[action])) {
            $(this.el)[action](this.parent.$(this[action]));
        } else {
            $(this.el)[action]($(this[action]));
        }
    }

    function _insertView ($startDeferred) {
        var template = this.template;
        if (template) {
            this.$el.html(template(this.dataToJSON()));
        }
        $startDeferred && $startDeferred.notify && $startDeferred.notify(AFTER_TEMPLATING_DONE);
    }

    function _setTemplate (options) {
        if (options && options.template) {
            this.template = _.template(options.template);
        }
    }

    function _setModel (options) {
        var self = this,
            ModelType = MasseuseModel,
            modelData;

        if (options && options.ModelType) {
            ModelType = options.ModelType;
        }
        if (!this.model) {
            modelData = _.result(options, MODEL_DATA);
            _.each(modelData, function (datum, key) {
                if (datum instanceof ViewContext) {
                    modelData[key] = datum.getBoundFunction(self);
                }
                if (datum instanceof ProxyProperty || datum instanceof ObserverProperty) {
                    if (datum.model instanceof ViewContext) {
                        datum.model = datum.model.getBoundFunction(self);
                    }
                }
            });
            this.model = new ModelType(modelData);
        } else {
            this.model = options.model;
        }
    }

    function _setBoundEventListeners (options) {
        if (!options) {
            return;
        }
        this.bindEventListeners(options.listeners || options.bindings);
    }
});
