(function($) {

Drupal.admin = Drupal.admin || {};
Drupal.admin.behaviors = Drupal.admin.behaviors || {};
Drupal.admin.hashes = Drupal.admin.hashes || {};

/**
 * Core behavior for Administration menu.
 *
 * Test whether there is an administration menu is in the output and execute all
 * registered behaviors.
 */
Drupal.behaviors.adminMenu = {
  attach: function (context, settings) {
    // Initialize settings.
    settings.admin_menu = $.extend({
      suppress: false,
      margin_top: false,
      position_fixed: false,
      tweak_modules: false,
      tweak_permissions: false,
      tweak_tabs: false,
      destination: '',
      basePath: settings.basePath,
      hash: 0,
      replacements: {}
    }, settings.admin_menu || {});
    // Check whether administration menu should be suppressed.
    if (settings.admin_menu.suppress) {
      return;
    }
    var $adminMenu = $('#admin-menu:not(.admin-menu-processed)', context);
    // Client-side caching; if administration menu is not in the output, it is
    // fetched from the server and cached in the browser.
    if (!$adminMenu.length && settings.admin_menu.hash) {
      Drupal.admin.getCache(settings.admin_menu.hash, function (response) {
          if (typeof response == 'string' && response.length > 0) {
            $('body', context).append(response);
          }
          var $adminMenu = $('#admin-menu:not(.admin-menu-processed)', context);
          // Apply our behaviors.
          Drupal.admin.attachBehaviors(context, settings, $adminMenu);
          // Allow resize event handlers to recalculate sizes/positions.
          $(window).triggerHandler('resize');
      });
    }
    // If the menu is in the output already, this means there is a new version.
    else {
      // Apply our behaviors.
      Drupal.admin.attachBehaviors(context, settings, $adminMenu);
    }
  }
};

/**
 * Collapse fieldsets on Modules page.
 */
Drupal.behaviors.adminMenuCollapseModules = {
  attach: function (context, settings) {
    if (settings.admin_menu.tweak_modules) {
      $('#system-modules fieldset:not(.collapsed)', context).addClass('collapsed');
    }
  }
};

/**
 * Collapse modules on Permissions page.
 */
Drupal.behaviors.adminMenuCollapsePermissions = {
  attach: function (context, settings) {
    if (settings.admin_menu.tweak_permissions) {
      // Freeze width of first column to prevent jumping.
      $('#permissions th:first', context).css({ width: $('#permissions th:first', context).width() });
      // Attach click handler.
      $modules = $('#permissions tr:has(td.module)', context).once('admin-menu-tweak-permissions', function () {
        var $module = $(this);
        $module.bind('click.admin-menu', function () {
          // @todo Replace with .nextUntil() in jQuery 1.4.
          $module.nextAll().each(function () {
            var $row = $(this);
            if ($row.is(':has(td.module)')) {
              return false;
            }
            $row.toggleClass('element-hidden');
          });
        });
      });
      // Collapse all but the targeted permission rows set.
      if (window.location.hash.length) {
        $modules = $modules.not(':has(' + window.location.hash + ')');
      }
      $modules.trigger('click.admin-menu');
    }
  }
};

/**
 * Apply margin to page.
 *
 * Note that directly applying marginTop does not work in IE. To prevent
 * flickering/jumping page content with client-side caching, this is a regular
 * Drupal behavior.
 */
Drupal.behaviors.adminMenuMarginTop = {
  attach: function (context, settings) {
    if (!settings.admin_menu.suppress && settings.admin_menu.margin_top) {
      $('body:not(.admin-menu)', context).addClass('admin-menu');
    }
  }
};

/**
 * Retrieve content from client-side cache.
 *
 * @param hash
 *   The md5 hash of the content to retrieve.
 * @param onSuccess
 *   A callback function invoked when the cache request was successful.
 */
Drupal.admin.getCache = function (hash, onSuccess) {
  if (Drupal.admin.hashes.hash !== undefined) {
    return Drupal.admin.hashes.hash;
  }
  $.ajax({
    cache: true,
    type: 'GET',
    dataType: 'text', // Prevent auto-evaluation of response.
    global: false, // Do not trigger global AJAX events.
    url: Drupal.settings.admin_menu.basePath.replace(/admin_menu/, 'js/admin_menu/cache/' + hash),
    success: onSuccess,
    complete: function (XMLHttpRequest, status) {
      Drupal.admin.hashes.hash = status;
    }
  });
};

/**
 * TableHeader callback to determine top viewport offset.
 *
 * @see toolbar.js
 */
Drupal.admin.height = function() {
  var $adminMenu = $('#admin-menu');
  var height = $adminMenu.outerHeight();
  // In IE, Shadow filter adds some extra height, so we need to remove it from
  // the returned height.
  if ($adminMenu.css('filter') && $adminMenu.css('filter').match(/DXImageTransform\.Microsoft\.Shadow/)) {
    height -= $adminMenu.get(0).filters.item("DXImageTransform.Microsoft.Shadow").strength;
  }
  return height;
};

/**
 * @defgroup admin_behaviors Administration behaviors.
 * @{
 */

/**
 * Attach administrative behaviors.
 */
Drupal.admin.attachBehaviors = function (context, settings, $adminMenu) {
  if ($adminMenu.length) {
    $adminMenu.addClass('admin-menu-processed');
    $.each(Drupal.admin.behaviors, function() {
      this(context, settings, $adminMenu);
    });
  }
};

/**
 * Apply 'position: fixed'.
 */
Drupal.admin.behaviors.positionFixed = function (context, settings, $adminMenu) {
  if (settings.admin_menu.position_fixed) {
    $adminMenu.addClass('admin-menu-position-fixed');
    $adminMenu.css('position', 'fixed');
  }
};

/**
 * Move page tabs into administration menu.
 */
Drupal.admin.behaviors.pageTabs = function (context, settings, $adminMenu) {
  if (settings.admin_menu.tweak_tabs) {
    var $tabs = $(context).find('ul.tabs.primary');
    $adminMenu.find('#admin-menu-wrapper > ul').eq(1)
      .append($tabs.find('li').addClass('admin-menu-tab'));
    $(context).find('ul.tabs.secondary')
      .appendTo('#admin-menu-wrapper > ul > li.admin-menu-tab.active')
      .removeClass('secondary');
    $tabs.remove();
  }
};

/**
 * Perform dynamic replacements in cached menu.
 */
Drupal.admin.behaviors.replacements = function (context, settings, $adminMenu) {
  for (var item in settings.admin_menu.replacements) {
    $(item, $adminMenu).html(settings.admin_menu.replacements[item]);
  }
};

/**
 * Inject destination query strings for current page.
 */
Drupal.admin.behaviors.destination = function (context, settings, $adminMenu) {
  if (settings.admin_menu.destination) {
    $('a.admin-menu-destination', $adminMenu).each(function() {
      this.search += (!this.search.length ? '?' : '&') + Drupal.settings.admin_menu.destination;
    });
  }
};

/**
 * Apply JavaScript-based hovering behaviors.
 *
 * @todo This has to run last.  If another script registers additional behaviors
 *   it will not run last.
 */
Drupal.admin.behaviors.hover = function (context, settings, $adminMenu) {
  // Hover emulation for IE 6.
  if ($.browser.msie && parseInt(jQuery.browser.version) == 6) {
    $('li', $adminMenu).hover(
      function () {
        $(this).addClass('iehover');
      },
      function () {
        $(this).removeClass('iehover');
      }
    );
  }

  // Delayed mouseout.
  $('li.expandable', $adminMenu).hover(
    function () {
      // Stop the timer.
      clearTimeout(this.sfTimer);
      // Display child lists.
      $('> ul', this)
        .css({left: 'auto', display: 'block'})
        // Immediately hide nephew lists.
        .parent().siblings('li').children('ul').css({left: '-999em', display: 'none'});
    },
    function () {
      // Start the timer.
      var uls = $('> ul', this);
      this.sfTimer = setTimeout(function () {
        uls.css({left: '-999em', display: 'none'});
      }, 400);
    }
  );
};

/**
 * Apply the search bar functionality.
 */
Drupal.admin.behaviors.search = function (context, settings, $adminMenu) {
  // @todo Add a HTML ID.
  var $input = $('input.admin-menu-search', $adminMenu);
  // Initialize the current search needle.
  var needle = $input.val();
  // Cache of all links that can be matched in the menu.
  var links;
  // Minimum search needle length.
  var needleMinLength = 2;
  // Append the results container.
  var $results = $('<div />').insertAfter($input);

  /**
   * Executes the search upon user input.
   */
  function keyupHandler() {
    var matches, $html, value = $(this).val();
    // Only proceed if the search needle has changed.
    if (value !== needle) {
      needle = value;
      // Initialize the cache of menu links upon first search.
      if (!links && needle.length >= needleMinLength) {
        // @todo Limit to links in dropdown menus; i.e., skip menu additions.
        links = buildSearchIndex($adminMenu.find('li:not(.admin-menu-action, .admin-menu-action li) > a'));
      }
      // Empty results container when deleting search text.
      if (needle.length < needleMinLength) {
        $results.empty();
      }
      // Only search if the needle is long enough.
      if (needle.length >= needleMinLength && links) {
        matches = findMatches(needle, links);
        // Build the list in a detached DOM node.
        $html = buildResultsList(matches);
        // Display results.
        $results.empty().append($html);
      }
    }
  }

  /**
   * Builds the search index.
   */
  function buildSearchIndex($links) {
    return $links
      .map(function () {
        var text = (this.textContent || this.innerText);
        // Skip menu entries that do not contain any text (e.g., the icon).
        if (typeof text === 'undefined') {
          return;
        }
        return {
          text: text,
          textMatch: text.toLowerCase(),
          element: this
        };
      });
  }

  /**
   * Searches the index for a given needle and returns matching entries.
   */
  function findMatches(needle, links) {
    var needleMatch = needle.toLowerCase();
    // Select matching links from the cache.
    return $.grep(links, function (link) {
      return link.textMatch.indexOf(needleMatch) !== -1;
    });
  }

  /**
   * Builds the search result list in a detached DOM node.
   */
  function buildResultsList(matches) {
    var $html = $('<ul class="dropdown admin-menu-search-results" />');
    $.each(matches, function () {
      var result = this.text;
      var $element = $(this.element);

      // Check whether there is a top-level category that can be prepended.
      var $category = $element.closest('#admin-menu-wrapper > ul > li');
      var categoryText = $category.find('> a').text()
      if ($category.length && categoryText) {
        result = categoryText + ': ' + result;
      }

      var $result = $('<li><a href="' + $element.attr('href') + '">' + result + '</a></li>');
      $result.data('original-link', $(this.element).parent());
      $html.append($result);
    });
    return $html;
  }

  /**
   * Highlights selected result.
   */
  function resultsHandler(e) {
    var $this = $(this);
    var show = e.type === 'mouseenter' || e.type === 'focusin';
    $this.trigger(show ? 'showPath' : 'hidePath', [this]);
  }

  /**
   * Closes the search results and clears the search input.
   */
  function resultsClickHandler(e, link) {
    var $original = $(this).data('original-link');
    $original.trigger('mouseleave');
    $input.val('').trigger('keyup');
  }

  /**
   * Shows the link in the menu that corresponds to a search result.
   */
  function highlightPathHandler(e, link) {
    if (link) {
      var $original = $(link).data('original-link');
      var show = e.type === 'showPath';
      // Toggle an additional CSS class to visually highlight the matching link.
      // @todo Consider using same visual appearance as regular hover.
      $original.toggleClass('highlight', show);
      $original.trigger(show ? 'mouseenter' : 'mouseleave');
    }
  }

  // Attach showPath/hidePath handler to search result entries.
  $results.delegate('li', 'mouseenter mouseleave focus blur', resultsHandler);
  // Hide the result list after a link has been clicked, useful for overlay.
  $results.delegate('li', 'click', resultsClickHandler);
  // Attach hover/active highlight behavior to search result entries.
  $adminMenu.delegate('.admin-menu-search-results li', 'showPath hidePath', highlightPathHandler);
  // Attach the search input event handler.
  $input.bind('keyup search', keyupHandler);
};

/**
 * @} End of "defgroup admin_behaviors".
 */

})(jQuery);
;
/**
 * @file
 * Javascript behaviors and helpers for modules/fb.
 */

FB_JS = function(){};
FB_JS.fbu = null; // Detect session changes
FB_JS.ignoreEvents = false; // Hack makes login status test possible
FB_JS.reloadParams = {}; // Pass data to drupal when reloading

FB_JS.fbu = null;

if (!window.Node) { // IE
  FB_JS.DOCUMENT_NODE = 9;
}
else {
  FB_JS.DOCUMENT_NODE = window.Node.DOCUMENT_NODE;
}

/**
 * Drupal behaviors hook.
 * Called when page is loaded, or content added via javascript.
 */
(function ($) {
  Drupal.behaviors.fb = {
    attach : function(context) {
      FB_JS.drupalBehaviors(context);
    }
  };
})(jQuery);

/**
 * Called when page is loaded, or content added via javascript.
 */
FB_JS.drupalBehaviors = function(context) {

  // Sanity check.
  if (!Drupal.settings.fb) {
    // Reach here when Drupal footer is not rendered in page template.
    Drupal.settings.fb = {};
  }

  // Respond to our jquery pseudo-events
  var events = jQuery(document).data('events');
  if (!events || !events.fb_session_change) {
    jQuery(document).bind('fb_session_change', FB_JS.sessionChangeHandler);
  }

  // If FB is not yet initialized, fbAsyncInit() will be called when it is.
  if (typeof(FB) != 'undefined') {
    // Render any XFBML markup that may have been added by AJAX.
    jQuery(context).each(function() {
      var elem = jQuery(this).get(0);
      if (elem.nodeType == FB_JS.DOCUMENT_NODE) { // Popups are entire document.
        // FB.XFBML.parse() fails if passed document.  Pass body element instead.
        elem = jQuery(context).find('body').get(0);
      }

      try {
        FB.XFBML.parse(elem);
      }
      catch(error) {
        jQuery.event.trigger('fb_devel', error);
      }
    });

    FB_JS.showConnectedMarkup(Drupal.settings.fb.fbu, context);
  }

  // Markup with class .fb_show should be visible if javascript is enabled.  .fb_hide should be hidden.
  jQuery('.fb_hide', context).hide();
  jQuery('.fb_show', context).show();

  if (Drupal.settings.fb.fb_reloading) {
    // The reloading flag helps us avoid infinite loops.  But will accidentally prevent a reload in some cases. We really want to prevent a reload for a few seconds.
    setTimeout(function() {
      Drupal.settings.fb.fb_reloading = false;
    }, 5000);
  }
};

if (typeof(window.fbAsyncInit) != 'undefined') {
  // There should be only one definition of fbAsyncInit!
  jQuery.event.trigger('fb_devel', {});
};

window.fbAsyncInit = function() {

  if (Drupal.settings.fb) {
    FB.init(Drupal.settings.fb.fb_init_settings);
  }

  if (Drupal.settings.fb.fb_init_settings.authResponse) {
    // Trust login status passed into us.  No getLoginStatus
    FB_JS.fbAsyncInitFinal();

  }
  else if (!Drupal.settings.fb.fb_init_settings ||
           !Drupal.settings.fb.fb_init_settings.appId) {
    // Once upon a time, we could test FB._apikey to learn whether FB was initialize with an appId.  Now, there is no way to do that.  So the test above uses the data we pass in.  Unfortunately if FB is not initialized by our code things may not work properly here.

    // Cannot call getLoginStatus when not hosting an app.
    FB_JS.fbAsyncInitFinal();
  }
  else {
    FB_JS.getLoginStatus(function(response) {
      if (Drupal.settings.fb.fbu && !response.authResponse) {
        if (Drupal.settings.fb.page_type) {
          // On canvas and tabs(?), this probably means third-party cookies not accepted.
          jQuery.event.trigger('fb_devel', {}); // debug
          FB_JS.reloadParams.fb_login_status = false;
        }
      }
      FB_JS.fbAsyncInitFinal(response);
    });
  }
}

FB_JS._fbAsyncInitFinalComplete = false; // semaphore
FB_JS.fbAsyncInitFinal = function(response) {

  if (FB_JS._fbAsyncInitFinalComplete && !response) {
    return; // execute this function only once.
  }
  FB_JS._fbAsyncInitFinalComplete = true;

  if (!response) {
    response = FB.getAuthResponse();
  }

  jQuery.event.trigger('fb_init');  // Trigger event for third-party modules.

  if (response) {
    FB_JS.authResponseChange(response); // This will act only if fbu changed.
  }

  FB_JS.eventSubscribe();  // Get notified when session changes

  FB_JS.showConnectedMarkup(FB.getUserID()); // Show/hide markup based on connect status

  if (typeof(FB.XFBML) != 'undefined') { // Soon to be deprecated?
    try {
      FB.XFBML.parse();
    }
    catch (error) {
      jQuery.event.trigger('fb_devel', error);
    }
  }
};

/**
 * Wrapper for FB.getLoginStatus().
 * Unlike the FB version, this function always calls its callback.
 */
FB_JS.getLoginStatus = function(callback, force) {
  var semaphore; // Avoid multiple calls to callback.
  semaphore = false;

  FB.getLoginStatus(function(response) {
    semaphore = true;
    callback(response);
  }, force);

  // Fallback for when getLoginStatus never calls us back.
  setTimeout(function() {
    if (!semaphore) {
      callback({'authResponse' : null});
    }
  }, 3000); // 3000 = 3 seconds
};

/**
 * Tell facebook to notify us of events we may need to act on.
 */
FB_JS.eventSubscribe = function() {
  // Use FB.Event to detect Connect login/logout.
  FB.Event.subscribe('auth.authResponseChange', FB_JS.authResponseChange);

  // Q: what the heck is "edge.create"? A: the like button was clicked.
  FB.Event.subscribe('edge.create', FB_JS.edgeCreate);
}

/**
 * Helper parses URL params.
 *
 * http://jquery-howto.blogspot.com/2009/09/get-url-parameters-values-with-jquery.html
 */
FB_JS.getUrlVars = function(href) {
  var vars = [], hash;
  var hashes = href.slice(href.indexOf('?') + 1).split('&');
  for(var i = 0; i < hashes.length; i++)
  {
    hash = hashes[i].split('=');
    vars[hash[0]] = hash[1];
    if (hash[0] != 'fbu')
      vars.push(hashes[i]); // i.e. "foo=bar"
  }
  return vars;
}

/**
 * Reload the current page, whether on canvas page or facebook connect.
 *
 */
FB_JS.reloading = false // semaphore prevents concurrent reloads.
FB_JS.reload = function(destination) {
  if (FB_JS.reloading) {
    // We are attempting to reload two times at once.
    return;
  }
  else {
    FB_JS.reloading = true;
  }
  // Avoid repeated reloads.  Esp on canvas pages when third-party cookies disabled.
  if (Drupal.settings.fb.fb_reloading) {
    // We are attempting a reload one after another.
    jQuery.event.trigger('fb_devel', destination); // Debug. JS and PHP SDKs are not in sync.
    return;
  }

  // Determine where to send user.
  if (typeof(destination) != 'undefined' && destination) {
    // Use destination passed in.
  }
  else if (typeof(Drupal.settings.fb.reload_url) != 'undefined') {
    destination = Drupal.settings.fb.reload_url;
  }
  else {
    destination = window.location.href;
  }

  // Split and parse destination
  var path;
  if (destination.indexOf('?') == -1) {
    vars = [];
    path = destination;
  }
  else {
    vars = FB_JS.getUrlVars(destination);
    path = destination.substr(0, destination.indexOf('?'));
  }

  // Passing this helps us avoid infinite loop.
  FB_JS.reloadParams.fb_reload = true;

  // Canvas pages will not get POST vars, so include them in the URL.
  if (Drupal.settings.fb.page_type == 'canvas') {
    for (var key in FB_JS.reloadParams) {
      vars.push(key + '=' + FB_JS.reloadParams[key]);
    }
  }

  destination = vars.length ? (path + '?' + vars.join('&')) : path;

  if (Drupal.settings.fb.reload_url_fragment) {
    destination = destination + "#" + Drupal.settings.fb.reload_url_fragment;
  }

  // Feedback that entire page may be reloading.
  if (typeof(Drupal.settings.fb.reload_progress) == 'undefined' || Drupal.settings.fb.reload_progress) {
    // This unweildy set of tags should turn facebook-specific markup into a progress indicator.
    var fbMarkup = jQuery('.fb_connected,.fb_not_connected').wrap('<div class="progress" />').wrap('<div class="bar" />').wrap('<div class="filled" />');
    if (fbMarkup.length) {
      fbMarkup.hide(); // Hides FBML, leaves progress bar.
    }


    // Spinning progress indicator
    jQuery('body').prepend('<div id="fb_reload"><div class="fb_spinner"></div></div>');
  }

  // Use POST to get past any caching on the server.
  // reloadParams includes signed_request.
  if (Drupal.settings.fb.fbu && Drupal.settings.fb.test_login_status) {
    // The login status test might break all future calls to FB.  So we do it only immediately before reload.
    FB_JS.testGetLoginStatus(function() {
      FB_JS.postToURL(destination, FB_JS.reloadParams);
    });
  }
  else if (!FB_JS.isEmpty(FB_JS.reloadParams)) {
    FB_JS.postToURL(destination, FB_JS.reloadParams);
  }
  else {
    window.top.location = destination; // Uses GET, returns cached pages.
  }

};

/**
 * Send the browser to a URL.
 * Similar to setting window.top.location, but via POST instead of GET.
 * POST will get through Drupal cache or external cache (i.e. Varnish)
 */
FB_JS.postToURL = function(path, params, method) {
  method = method || "post"; // Set method to post by default, if not specified.

  // The rest of this code assumes you are not using a library.
  // It can be made less wordy if you use one.
  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);
  form.setAttribute("target", '_top'); // important for canvas pages

  for(var key in params) {
    if(params.hasOwnProperty(key)) {
      var hiddenField = document.createElement("input");
      hiddenField.setAttribute("type", "hidden");
      hiddenField.setAttribute("name", key);
      hiddenField.setAttribute("value", params[key]);

      form.appendChild(hiddenField);
    }
  }

  document.body.appendChild(form);
  form.submit();
}


// Facebook pseudo-event handlers.
FB_JS.authResponseChange = function(response) {
  if (FB_JS.ignoreEvents) {
    return;
  }

  if (response.authResponse && response.authResponse.signedRequest) {
    // If we end up reloading page, pass signed request.
    FB_JS.reloadParams.signed_request = response.authResponse.signedRequest;
  }
  else {
    delete FB_JS.reloadParams.signed_request;
  }

  var status = {
    'changed': false,
    'fbu': FB.getUserID(),
    'response' : response
  };

  if ((Drupal.settings.fb.fbu || status.fbu) &&
      Drupal.settings.fb.fbu != status.fbu) {
    // Drupal.settings.fb.fbu (from server) not the same as status.fbu (from javascript).
    status.changed = true;
  }
  else if (status.fbu && !response.authResponse) {
    // A bug in facebook's all.js, user has logged out yet FB.getUserID() still returns their id!
    // This is our workaround.
    status.changed = true;
    status.fbu = null;
  }


  if (status.changed) {
    // Remember the fbu.
    Drupal.settings.fb.fbu = status.fbu;

    // fbu has changed since server built the page.
    jQuery.event.trigger('fb_session_change', status);

    FB_JS.showConnectedMarkup(status.fbu);
  }
};

// edgeCreate is handler for Like button.
FB_JS.edgeCreate = function(href, widget) {
  var data = {'href': href};
  FB_JS.ajaxEvent('edge.create', data);
};

// JQuery pseudo-event handler.
FB_JS.sessionChangeHandler = function(context, status) {
  // Pass data to ajax event.
  var data = {
    'event_type': 'session_change',
    'is_anonymous': Drupal.settings.fb.is_anonymous
  };

  data.fbu = status.fbu;

  FB_JS.ajaxEvent(data.event_type, data);

  // Note that ajaxEvent might reload the page.
};


// Helper to pass events via AJAX.
// A list of javascript functions to be evaluated is returned.
FB_JS.ajaxEvent = function(event_type, request_data) {
  if (Drupal.settings.fb.ajax_event_url) {

    if (typeof(Drupal.settings.fb_page_type) != 'undefined') {
      request_data.fb_js_page_type = Drupal.settings.fb_page_type;
    }

    // Historically, we pass appId to ajax events.
    // This data no longer present in JS API, so may be removed soon.
    // In other words, deprecated!
    request_data.appId = Drupal.settings.fb.fb_init_settings.appId;

    // Other values to pass to ajax handler.
    if (Drupal.settings.fb.controls) {
      request_data.fb_controls = Drupal.settings.fb.controls;
    }

    // In case cookies are not accurate, always pass in signed request.
    if (typeof(FB.getAuthResponse) != 'undefined') {
      response = FB.getAuthResponse();
      if (response && response.signedRequest) {
        request_data.signed_request = response.signedRequest;
      }
    }
    else {
      session = FB.getSession();
      if (session) {
        //request_data.session = session;
        request_data.access_token = session.access_token;
      }
    }


    jQuery.ajax({
      url: Drupal.settings.fb.ajax_event_url + '/' + event_type,
      data : request_data,
      type: 'POST',
      dataType: 'json',
      success: function(js_array, textStatus, XMLHttpRequest) {
        if (js_array.length > 0) {
          for (var i = 0; i < js_array.length; i++) {
            // alert(js_array[i]);// debug
            eval(js_array[i]);
          }
        }
        else {
          if (event_type == 'session_change') {
            // No instructions from ajax.  Notify interested parties
            jQuery.event.trigger('fb_session_change_done');
          }
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        // Unexpected error (i.e. ajax did not return json-encoded data).
        var headers = jqXHR.getAllResponseHeaders(); // debug info.
        var responseText = jqXHR.responseText; // debug info.
        // @TODO: handle error, but how?
        jQuery.event.trigger('fb_devel', jqXHR);
      }
    });
  }
};


/**
 * Called when we first learn the currently logged in user's Facebook ID.
 *
 * Responsible for showing/hiding markup not intended for the current
 * user.  Some sites will choose to render pages with fb_connected and
 * fb_not_connected classes, rather than reload pages when user's
 * connect/disconnect.
 */
FB_JS.showConnectedMarkup = function(fbu, context) {
  if (context || fbu != FB_JS.fbu) {
    if (fbu) {
      FB_JS.fbu = fbu;
      // Show markup intended only for connected users.
      jQuery('.fb_not_connected', context).hide();
      jQuery('.fb_connected', context).show();
    }
    else {
      FB_JS.fbu = null;
      // Show markup intended only for not connected users.
      jQuery('.fb_connected', context).hide();
      jQuery('.fb_not_connected', context).show();
    }
  }
};

/**
 * Tests whether FB.getLoginStatus() will work.
 * It tends to fail when user disables third-party cookies, and when apps are in sandbox mode, and probably more cases.
 * The danger of running this test is that if it fails, future calls to FB will break, because FB will forget the current user's credentials.
 */
FB_JS.testGetLoginStatus = function(callback) {
  // Attempt to learn whether third party cookies are enabled.
  FB_JS.ignoreEvents = true; // disregard events triggered by getLoginStatus.
  FB_JS.getLoginStatus(function(response) {
    FB_JS.ignoreEvents = false; // we can pay attention again
    if (!response.authResponse) {
      // Let fb.module know that test failed.
      FB_JS.reloadParams.fb_login_status = false;
    }
    callback(response.authResponse);
  }, true);
};


// Quick test whether object contains anything.
FB_JS.isEmpty = function(ob) {
  for (var i in ob) {
    return false;
  }
  return true;
}
;
(function($) {

Drupal.admin = Drupal.admin || {};
Drupal.admin.behaviors = Drupal.admin.behaviors || {};

/**
 * @ingroup admin_behaviors
 * @{
 */

/**
 * Apply active trail highlighting based on current path.
 *
 * @todo Not limited to toolbar; move into core?
 */
Drupal.admin.behaviors.toolbarActiveTrail = function (context, settings, $adminMenu) {
  if (settings.admin_menu.toolbar && settings.admin_menu.toolbar.activeTrail) {
    $adminMenu.find('> div > ul > li > a[href="' + settings.admin_menu.toolbar.activeTrail + '"]').addClass('active-trail');
  }
};

/**
 * Toggles the shortcuts bar.
 */
Drupal.admin.behaviors.shortcutToggle = function (context, settings, $adminMenu) {
  var $shortcuts = $adminMenu.find('.shortcut-toolbar');
  if (!$shortcuts.length) {
    return;
  }
  var storage = window.localStorage || false;
  var storageKey = 'Drupal.admin_menu.shortcut';
  var $body = $(context).find('body');
  var $toggle = $adminMenu.find('.shortcut-toggle');
  $toggle.click(function () {
    var enable = !$shortcuts.hasClass('active');
    $shortcuts.toggleClass('active', enable);
    $toggle.toggleClass('active', enable);
    if (settings.admin_menu.margin_top) {
      $body.toggleClass('admin-menu-with-shortcuts', enable);
    }
    // Persist toggle state across requests.
    storage && enable ? storage.setItem(storageKey, 1) : storage.removeItem(storageKey);
    this.blur();
    return false;
  });

  if (!storage || storage.getItem(storageKey)) {
    $toggle.trigger('click');
  }
};

/**
 * @} End of "ingroup admin_behaviors".
 */

})(jQuery);
;
