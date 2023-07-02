const LAYOUT_CONFIG_KEY = 'layoutConfigAsm';

const initialProgram =
  `int fac(int n) {
    if (n < 1) return 1;
    return n * fac(n - 1);
}`;

let asmEditor = null;
function AsmEditorComponent ( container, state ) {
  asmEditor = ace.edit( container.getElement()[ 0 ] );
  asmEditor.session.setMode( 'ace/mode/assembly_x86' );
  asmEditor.setOption( 'fontSize', `${ state.fontSize || 18 }px` );
  asmEditor.setReadOnly( true );

  container.on( 'fontSizeChanged', fontSize => {
    container.extendState( { fontSize } );
    asmEditor.setFontSize( `${ fontSize }px` );
  } );
  container.on( 'resize', debounceLazy( event => asmEditor.resize(), 20 ) );
  container.on( 'destroy', event => {
    if ( asmEditor ) {
      asmEditor.destroy();
      asmEditor = null;
    }
  } );
}

// Golden Layout
let layout = null;

function initLayout () {
  const defaultLayoutConfig = {
    settings: {
      showCloseIcon: false,
      showPopoutIcon: false,
    },
    content: [ {
      type: 'row',
      content: [ {
        type: 'component',
        componentName: 'editor',
        componentState: { fontSize: 18, value: initialProgram },
      }, {
        type: 'column',
        content: [ {
          type: 'component',
          componentName: 'terminal',
          componentState: { fontSize: 18 },
        }, {
          type: 'component',
          componentName: 'asmEditor',
          componentState: { fontSize: 18 },
        } ]
      } ]
    } ]
  };

  layout = new Layout( {
    configKey: LAYOUT_CONFIG_KEY,
    defaultLayoutConfig,
  } );

  layout.on( 'initialised', event => {
    editor.session.on( 'change', compile );
    compile();
  } );

  layout.registerComponent( 'asmEditor', AsmEditorComponent );
  layout.init();
};

// Toolbar stuff
let triple = 'x86_64';
function setTriple ( newTriple ) { triple = newTriple; compile(); }

let opt = '2';
function setOpt ( newOpt ) { opt = newOpt; compile(); }

$( '#reset' ).on( 'click', event => { if ( confirm( 'really reset?' ) ) resetLayout() } );
$( '#triple' ).on( 'input', event => setTriple( event.target.value ) );
$( '#opt' ).on( 'input', event => setOpt( event.target.value ) );


const compile = debounceLazy( async () => {
  const [ input, output ] = [ 'test.cc', 'test.S' ];
  const contents = editor.getValue();
  const outputBuf =
    await api.compileToAssembly( { input, output, contents, triple, opt } );
  let str = '';
  if ( outputBuf ) {
    const u8 = new Uint8Array( outputBuf );
    str = readStr( u8, 0, u8.length );
  }
  if ( asmEditor ) {
    asmEditor.setValue( str );
    asmEditor.clearSelection();
  }
}, 500 );


initLayout();
