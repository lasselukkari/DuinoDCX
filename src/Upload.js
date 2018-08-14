import React, {PureComponent} from 'react';
import Dropzone from 'react-dropzone';

import Spinner from 'react-spinkit';

class Upload extends PureComponent {
  constructor() {
    super();
    this.state = {};
  }

  handleDrop = acceptedFiles => { // eslint-disable-line no-undef
    this.setState({uploading: 'active'});

    fetch('/api/update', {
      method: 'POST',
      body: acceptedFiles[0],
      credentials: 'same-origin'
    }).then(response => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      this.setState({uploading: 'success'});
    }).catch(() => {
      this.setState({uploading: 'fail'});
    });
  };

  statusMessage() {
    const {uploading} = this.state;

    switch (uploading) {
      case 'active':
        return (<Spinner className="text-center" fadeIn="none" name="line-scale" color="#3498DB"/>);
      case 'fail':
        return 'Uploading failed.';
      case 'success':
        return 'Uploading succeeded. Hard refresh the page to empty cached files.';
      default:
        return 'Drag and drop file or click to open file dialog.';
    }
  }

  render() {
    return (
      <Dropzone
        style={{width: '100%', height: '180px', padding: '10px', borderWidth: 2,
          borderColor: '#666',
          borderStyle: 'dashed',
          borderRadius: 5}}
        rejectStyle={{borderStyle: 'solid',
          borderColor: '#c66',
          backgroundColor: '#eee'}}
        activeStyle={{
          borderStyle: 'solid',
          borderColor: '#6c6',
          backgroundColor: '#eee'
        }}
        onDrop={this.handleDrop}
        multiple={false}
        disablePreview
      >

        {this.statusMessage()}
      </Dropzone>
    );
  }
}

export default Upload;
