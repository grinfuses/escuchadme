Drupal.locale = { 'pluralFormula': function ($n) { return Number(($n!=1)); }, 'strings': {"":{"An AJAX HTTP error occurred.":"Hubo un error HTTP AJAX.","HTTP Result Code: !status":"C\u00f3digo de Resultado HTTP: !status","An AJAX HTTP request terminated abnormally.":"Una solicitud HTTP de AJAX termin\u00f3 de manera anormal.","Debugging information follows.":"A continuaci\u00f3n se detalla la informaci\u00f3n de depuraci\u00f3n.","Path: !uri":"Ruta: !uri","StatusText: !statusText":"StatusText: !statusText","ResponseText: !responseText":"ResponseText: !responseText","ReadyState: !readyState":"ReadyState: !readyState","Loading":"Cargando","(active tab)":"(solapa activa)","Hide":"Ocultar","Show":"Mostrar","@title dialog":"Di\u00e1logo @title","Configure":"Configurar","Disabled":"Desactivado","Enabled":"Activado","Edit":"Editar","Add":"Agregar","OK":"OK","Select all rows in this table":"Seleccionar todas las filas de esta tabla","Deselect all rows in this table":"Quitar la selecci\u00f3n a todas las filas de esta tabla","Not published":"No publicado","Please wait...":"Espere, por favor...","By @name on @date":"Por @name en @date","By @name":"Por @name","Not in menu":"No est\u00e1 en un men\u00fa","Alias: @alias":"Alias: @alias","No alias":"Sin alias","New revision":"Nueva revisi\u00f3n","Drag to re-order":"Arrastre para reordenar","Changes made in this table will not be saved until the form is submitted.":"Los cambios realizados en esta tabla no se guardar\u00e1n hasta que se env\u00ede el formulario","The changes to these blocks will not be saved until the \u003Cem\u003ESave blocks\u003C\/em\u003E button is clicked.":"Los cambios sobre estos bloques no se guardar\u00e1n hasta que no pulse el bot\u00f3n \u003Cem\u003EGuardar bloques\u003C\/em\u003E.","This permission is inherited from the authenticated user role.":"Este permiso se hereda del rol de usuario registrado.","No revision":"Sin revisi\u00f3n","@number comments per page":"@number comentarios por p\u00e1gina","Requires a title":"Necesita un t\u00edtulo","Not restricted":"Sin restricci\u00f3n","Not customizable":"No personalizable","Restricted to certain pages":"Restringido a algunas p\u00e1ginas","The block cannot be placed in this region.":"El bloque no se puede colocar en esta regi\u00f3n.","Hide summary":"Ocultar resumen","Edit summary":"Editar resumen","Don\u0027t display post information":"No mostrar informaci\u00f3n del env\u00edo","The selected file %filename cannot be uploaded. Only files with the following extensions are allowed: %extensions.":"El archivo seleccionado %filename no puede ser subido. Solo se permiten archivos con las siguientes extensiones: %extensions.","Re-order rows by numerical weight instead of dragging.":"Reordenar las filas por peso num\u00e9rico en lugar de arrastrar.","Show row weights":"Mostrar pesos de la fila","Hide row weights":"Ocultar pesos de la fila","Autocomplete popup":"Ventana emergente con autocompletado","Searching for matches...":"Buscando coincidencias"}} };;

/**
 * @file
 *
 * Javascript specific to facebook connect pages.  This means pages
 * which are not canvas pages, and where fb_connect.module has
 * initialized the facebook api. The user may or may not have
 * authorized the app, this javascript will still be loaded.
 *
 * Note (!) much of the work done here is deprecated, and moved to fb.js
 * (where code works equally well on both connect pages and canvas
 * pages).  If your app needs the features here, please report your
 * use case to our issue queue (http://drupal.org/project/issues/fb),
 * otherwise these features may go away...
 */
(function ($) {
  Drupal.behaviors.fb_connect = {
    attach: function(context, settings) {
      // Logout of facebook when logging out of drupal.
      jQuery("a[href^='" + Drupal.settings.basePath + "user/logout']", context).click(FB_Connect.logoutHandler);
      if (Drupal.settings.fb_connect.front_url != Drupal.settings.basePath) {
        jQuery("a[href^='" + Drupal.settings.fb_connect.front_url + "user/logout']", context).click(FB_Connect.logoutHandler); // front_url includes language.  I.e. "/en/"
      }

      // Support markup for dialog boxes.
      FB_Connect.enablePopups(context);

      var events = jQuery(document).data('events');
      if (!events || !events.fb_session_change) {
        jQuery(document).bind('fb_session_change', FB_Connect.sessionChangeHandler);
      }
    }
  };
})(jQuery);

FB_Connect = function(){};

// JQuery pseudo-event handler.
FB_Connect.sessionChangeHandler = function(context, status) {
  jQuery('.block-fb_connect')
    .ajaxStart(function() {
      // This is an attempt to trigger the drupal progress indicator.  Not convinced that it works.
      jQuery(this).wrap('<div class="bar filled"></div>').wrap('<div class="bar filled"></div>');
    })
    .ajaxStop(function() {
      //jQuery(this).html('');
      // unwrap() not defined.
      jQuery(this).parent().removeClass('bar filled').parent().removeClass('bar filled');
    })
  ;

  // Call the default handler, too.
  FB_JS.sessionChangeHandler(context, status);
};

// click handler
/**
 * We cannot simply follow link to drupal logout, because facebook
 * connect cookies are still present.  The user will be reconnected
 * right away.  We must call FB.logout().
 */
FB_Connect.logoutHandler = function(event) {
  var reloading = false;

  // When we reload, go to logout page.
  Drupal.settings.fb.reload_url = Drupal.settings.fb.base_url + "/user/logout";
  // No need to handle status change event because we know we're logged out and about to reload page.
  FB_JS.ignoreEvents = true;
  Drupal.settings.fb.test_login_status = false;


  if (typeof(FB) != 'undefined' && FB.getAuthResponse()) {
    try {
      FB.logout(function () {
        // We've logged out of facebook.
        FB_JS.reload();
      });

      // At this point we've asked facebook to log out.  If we "return true;" here, browser moves on to user/logout.  This is what we'd like to do.  But logout takes time and firefox specifically won't update cookies if leave the page before facebook does it's thing. http://drupal.org/node/1164048

      // Give firefox some time, then reload. We don't trust FB.logout() to ever call our callback function above.
      setTimeout(function() {
        FB_JS.getLoginStatus(function(response) {
          FB_JS.reload();
        }, true);
      }, 500);

      return false; // Don't follow the user/logout link right away.
    }
    catch (e) {
      debugger; // reason for exception?
      return true; // continue to user/logout
    }
  }
  else {
    return true; // continue to user/logout
  }
};

/**
 * Move new dialogs to visible part of screen.
 **/
FB_Connect.centerPopups = function() {
  var scrollTop = $(window).scrollTop();
  $('.fb_dialog:not(.fb_popup_centered)').each(function() {
    var offset = $(this).offset();
    if (offset.left == 0) {
      // This is some facebook cruft that cannot be centered.
    }
    else if (offset.top < 0) {
      // Not yet visible, don't center.
    }
    else if (offset.top < scrollTop) {
      $(this).css('top', offset.top + scrollTop + 'px');
      $(this).addClass('fb_popup_centered'); // Don't move this dialog again.
    }
  });
};


FB_Connect.enablePopups = function(context) {
  // Support for easy fbml popup markup which degrades when javascript not enabled.
  // Markup is subject to change.  Currently...
  // <div class=fb_fbml_popup_wrap><a title="POPUP TITLE">LINK MARKUP</a><div class=fb_fbml_popup><fb:SOME FBML>...</fb:SOME FBML></div></div>
  jQuery('.fb_fbml_popup:not(.fb_fbml_popup-processed)', context).addClass('fb_fbml_popup-processed').prev().each(
    function() {
      this.fbml_popup = $(this).next().html();
      this.fbml_popup_width = parseInt($(this).next().attr('width'));
      this.fbml_popup_height = parseInt($(this).next().attr('height'));
      //console.log("stored fbml_popup markup: " + this.fbml_popup); // debug
      $(this).next().remove(); // Remove FBML so facebook does not expand it.
    })
    // Handle clicks on the link element.
    .bind('click',
	  function (e) {
	    var popup;
	    //console.log('Clicked!  Will show ' + this.fbml_popup); // debug

	    // http://forum.developers.facebook.net/viewtopic.php?pid=243983
	    var size = FB.UIServer.Methods["fbml.dialog"].size;
	    if (this.fbml_popup_width) {
	      size.width=this.fbml_popup_width;
	    }
	    if (this.fbml_popup_height) {
	      size.height=this.fbml_popup_height;
	    }
	    FB.UIServer.Methods['fbml.dialog'].size = size;

	    // http://forum.developers.facebook.net/viewtopic.php?id=74743
	    var markup = this.fbml_popup;
	    if ($(this).attr('title')) {
	      markup = '<fb:header icon="true" decoration="add_border">' + $(this).attr('title') + '</fb:header>' + this.fbml_popup;
	    }
	    var dialog = {
	      method: 'fbml.dialog', // triple-secret undocumented feature.
	      display: 'dialog',
	      fbml: markup,
	      width: this.fbml_popup_width,
	      height: this.fbml_popup_height
	    };
	    var popup = FB.ui(dialog, function (response) {
	      console.log(response);
	    });

	    // Start a timer to keep popups centered.
	    // @TODO - avoid starting timer more than once.
	    window.setInterval(FB_Connect.centerPopups, 500);

	    e.preventDefault();
	  })
    .parent().show();
};
;
(function ($) {

/**
 * A progressbar object. Initialized with the given id. Must be inserted into
 * the DOM afterwards through progressBar.element.
 *
 * method is the function which will perform the HTTP request to get the
 * progress bar state. Either "GET" or "POST".
 *
 * e.g. pb = new progressBar('myProgressBar');
 *      some_element.appendChild(pb.element);
 */
Drupal.progressBar = function (id, updateCallback, method, errorCallback) {
  var pb = this;
  this.id = id;
  this.method = method || 'GET';
  this.updateCallback = updateCallback;
  this.errorCallback = errorCallback;

  // The WAI-ARIA setting aria-live="polite" will announce changes after users
  // have completed their current activity and not interrupt the screen reader.
  this.element = $('<div class="progress" aria-live="polite"></div>').attr('id', id);
  this.element.html('<div class="bar"><div class="filled"></div></div>' +
                    '<div class="percentage"></div>' +
                    '<div class="message">&nbsp;</div>');
};

/**
 * Set the percentage and status message for the progressbar.
 */
Drupal.progressBar.prototype.setProgress = function (percentage, message) {
  if (percentage >= 0 && percentage <= 100) {
    $('div.filled', this.element).css('width', percentage + '%');
    $('div.percentage', this.element).html(percentage + '%');
  }
  $('div.message', this.element).html(message);
  if (this.updateCallback) {
    this.updateCallback(percentage, message, this);
  }
};

/**
 * Start monitoring progress via Ajax.
 */
Drupal.progressBar.prototype.startMonitoring = function (uri, delay) {
  this.delay = delay;
  this.uri = uri;
  this.sendPing();
};

/**
 * Stop monitoring progress via Ajax.
 */
Drupal.progressBar.prototype.stopMonitoring = function () {
  clearTimeout(this.timer);
  // This allows monitoring to be stopped from within the callback.
  this.uri = null;
};

/**
 * Request progress data from server.
 */
Drupal.progressBar.prototype.sendPing = function () {
  if (this.timer) {
    clearTimeout(this.timer);
  }
  if (this.uri) {
    var pb = this;
    // When doing a post request, you need non-null data. Otherwise a
    // HTTP 411 or HTTP 406 (with Apache mod_security) error may result.
    $.ajax({
      type: this.method,
      url: this.uri,
      data: '',
      dataType: 'json',
      success: function (progress) {
        // Display errors.
        if (progress.status == 0) {
          pb.displayError(progress.data);
          return;
        }
        // Update display.
        pb.setProgress(progress.percentage, progress.message);
        // Schedule next timer.
        pb.timer = setTimeout(function () { pb.sendPing(); }, pb.delay);
      },
      error: function (xmlhttp) {
        pb.displayError(Drupal.ajaxError(xmlhttp, pb.uri));
      }
    });
  }
};

/**
 * Display errors on the page.
 */
Drupal.progressBar.prototype.displayError = function (string) {
  var error = $('<div class="messages error"></div>').html(string);
  $(this.element).before(error).hide();

  if (this.errorCallback) {
    this.errorCallback(this);
  }
};

})(jQuery);
;
