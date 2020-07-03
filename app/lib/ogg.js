// Generated by LiveScript 1.5.0
(function(){
  var libvorbis, encoder_init, encoder_stream_init, encoder_clear, encoder_analysis_buffer, encoder_process, encoder_data_len, encoder_transfer_data, HEAPU8, HEAPU32, HEAPF32, ref$, keys, each, map, apply, at, encoder_set_tag, setTags, Encoder, slice$ = [].slice;
  libvorbis = require('./libvorbis.js'), encoder_init = libvorbis._encoder_init, encoder_stream_init = libvorbis._encoder_stream_init, encoder_clear = libvorbis._encoder_clear, encoder_analysis_buffer = libvorbis._encoder_analysis_buffer, encoder_process = libvorbis._encoder_process, encoder_data_len = libvorbis._encoder_data_len, encoder_transfer_data = libvorbis._encoder_transfer_data, HEAPU8 = libvorbis.HEAPU8, HEAPU32 = libvorbis.HEAPU32, HEAPF32 = libvorbis.HEAPF32;
  ref$ = require('prelude-ls'), keys = ref$.keys, each = ref$.each, map = ref$.map, apply = ref$.apply, at = ref$.at;
  encoder_set_tag = libvorbis.cwrap('encoder_set_tag', void 8, ['number', 'string', 'string']);
  setTags = function(encoder, tags){
    return each(compose$(function(it){
      return [encoder, it, tags[it].toString()];
    }, apply(encoder_set_tag)))(
    keys(
    tags));
  };
  module.exports = Encoder = (function(){
    Encoder.displayName = 'Encoder';
    var prototype = Encoder.prototype, constructor = Encoder;
    function Encoder(sampleRate, numChannels, quality, tags){
      tags == null && (tags = {});
      this.numChannels = numChannels;
      this.oggBuffers = [];
      this.encoder = encoder_init(numChannels, sampleRate, quality);
      setTags(this.encoder, (tags.ENCODER = 'vorbis-encoder-js', tags));
      encoder_stream_init(this.encoder);
    }
    Encoder.prototype.encodeFrom = function(audioBuffer){
      var this$ = this;
      return each(bind$(this, 'encode'))(
      function(data){
        var buffers, i$, to$, i;
        buffers = [];
        for (i$ = 0, to$ = data[0].length; i$ <= to$; i$ += 4096) {
          i = i$;
          bind$(buffers, 'push')(
          map(compose$(partialize$.apply(this$, [at, [void 8, data], [0]]), fn$))(
          (fn1$.call(this$))));
        }
        return buffers;
        function fn$(it){
          return it.slice(i, i + 4096);
        }
        function fn1$(){
          var i$, to$, results$ = [];
          for (i$ = 0, to$ = this.numChannels; i$ < to$; ++i$) {
            results$.push(i$);
          }
          return results$;
        }
      }(
      map(function(it){
        return audioBuffer.getChannelData(it);
      })(
      (function(){
        var i$, to$, results$ = [];
        for (i$ = 0, to$ = this.numChannels; i$ < to$; ++i$) {
          results$.push(i$);
        }
        return results$;
      }.call(this)))));
    };
    Encoder.prototype.encode = function(buffers){
      var length, analysis_buffer, i$, to$, ch;
      length = buffers[0].length;
      analysis_buffer = encoder_analysis_buffer(this.encoder, buffers[0].length) >> 2;
      for (i$ = 0, to$ = this.numChannels; i$ < to$; ++i$) {
        ch = i$;
        HEAPF32.set(buffers[ch], HEAPU32[analysis_buffer + ch] >> 2);
      }
      return this.process(length);
    };
    Encoder.prototype.finish = function(mimeType){
      var blob;
      this.process(0);
      blob = new Blob(this.oggBuffers, {
        type: mimeType || 'audio/ogg'
      });
      this.cleanup();
      return blob;
    };
    Encoder.prototype.cancel = function(){
      var ref$;
      encoder_clear(this.encoder);
      delete this.encoder;
      return ref$ = this.oggBuffers, delete this.oggBuffers, ref$;
    };
    Encoder.prototype.cleanup = function(){
      return this.cancel();
    };
    Encoder.prototype.process = function(length){
      var len, data;
      encoder_process(this.encoder, length);
      len = encoder_data_len(this.encoder);
      if (len > 0) {
        data = encoder_transfer_data(this.encoder);
        return bind$(this.oggBuffers, 'push')(
        function(it){
          return new Uint8Array(it);
        }(
        HEAPU8.subarray(data, data + len)));
      }
    };
    return Encoder;
  }());
  function compose$() {
    var functions = arguments;
    return function() {
      var i, result;
      result = functions[0].apply(this, arguments);
      for (i = 1; i < functions.length; ++i) {
        result = functions[i](result);
      }
      return result;
    };
  }
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
  function partialize$(f, args, where){
    var context = this;
    return function(){
      var params = slice$.call(arguments), i,
          len = params.length, wlen = where.length,
          ta = args ? args.concat() : [], tw = where ? where.concat() : [];
      for(i = 0; i < len; ++i) { ta[tw[0]] = params[i]; tw.shift(); }
      return len < wlen && len ?
        partialize$.apply(context, [f, ta, tw]) : f.apply(context, ta);
    };
  }
}).call(this);
