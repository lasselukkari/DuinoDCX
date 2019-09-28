const constants = require('./constants');

const setupCommands = [
  {
    name: 'Input Sum Type',
    type: 'enum',
    values: constants.INPUT_SUM_TYPES,
    syncResponse: {
      bits6: {
        part: 0,
        index: 117
      }
    }
  },
  {
    name: 'Input AB Source',
    type: 'enum',
    values: constants.INPUT_AB_SOURCES,
    syncResponse: {
      bits6: {
        part: 0,
        index: 119
      }
    }
  },
  {
    name: 'Input C Gain',
    type: 'enum',
    values: constants.INPUT_C_GAINS,
    syncResponse: {
      bits6: {
        part: 0,
        index: 121
      }
    }
  },
  {
    name: 'Output Config',
    type: 'enum',
    values: constants.OUTPUT_CONFIGS,
    syncResponse: {
      bits6: {
        part: 0,
        index: 123
      }
    }
  },
  {
    name: 'Stereolink',
    type: 'bool',
    syncResponse: {
      bits6: {
        part: 0,
        index: 126
      }
    }
  },
  {
    name: 'Stereolink Mode',
    type: 'enum',
    values: constants.STEREO_LINK_MODES,
    syncResponse: {
      bits6: {
        part: 0,
        index: 128
      }
    }
  },
  {
    name: 'Delay Link',
    type: 'bool',
    syncResponse: {
      bits6: {
        part: 0,
        index: 130
      }
    }
  },
  {
    name: 'Crossover Link',
    type: 'bool',
    syncResponse: {
      bits6: {
        part: 0,
        index: 133
      }
    }
  },
  {
    name: 'Is Delay Correction On',
    type: 'bool',
    syncResponse: {
      bits6: {
        part: 0,
        index: 135
      }
    }
  },
  {
    name: 'Air Temperature',
    unit: '°C',
    type: 'number',
    min: -20,
    max: 50,
    step: 1,
    syncResponse: {
      bits6: {
        part: 0,
        index: 137
      }
    }
  },
  {
    name: 'Delay Units',
    type: 'enum',
    values: constants.DELAY_UNITS,
    syncResponse: {
      bits6: {
        part: 0,
        index: 55
      }
    }
  },
  {
    name: 'Mute Outs When Powered',
    type: 'bool',
    syncResponse: {
      bits6: {
        part: 0,
        index: 57
      }
    }
  },
  {
    name: 'Input A Sum Gain',
    type: 'number',
    unit: 'dB',
    min: -15,
    max: 15,
    step: 0.1,
    syncResponse: {
      bits6: {
        part: 0,
        index: 139
      },
      bit7: {
        part: 0,
        index: 140,
        bit: 6
      },
      bits8: {
        part: 0,
        index: 141
      }
    }
  },
  {
    name: 'Input B Sum Gain',
    type: 'number',
    unit: 'dB',
    min: -15,
    max: 15,
    step: 0.1,
    syncResponse: {
      bits6: {
        part: 0,
        index: 142
      },
      bit7: {
        part: 0,
        index: 148,
        bit: 1
      },
      bits8: {
        part: 0,
        index: 143
      }
    }
  },
  {
    name: 'Input C Sum Gain',
    type: 'number',
    unit: 'dB',
    min: -15,
    max: 15,
    step: 0.1,
    syncResponse: {
      bits6: {
        part: 0,
        index: 144
      },
      bit7: {
        part: 0,
        index: 148,
        bit: 3
      },
      bits8: {
        part: 0,
        index: 145
      }
    }
  }
];

const inputOutputCommands = [
  {
    name: 'Gain',
    type: 'number',
    unit: 'dB',
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 146
        },
        bit7: {
          part: 0,
          index: 148,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 147
        }
      },
      {
        bits6: {
          part: 0,
          index: 288
        },
        bit7: {
          part: 0,
          index: 292,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 289
        }
      },
      {
        bits6: {
          part: 0,
          index: 430
        },
        bit7: {
          part: 0,
          index: 436,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 431
        }
      },
      {
        bits6: {
          part: 0,
          index: 571
        },
        bit7: {
          part: 0,
          index: 572,
          bit: 6
        },
        bits8: {
          part: 0,
          index: 573
        }
      },
      {
        bits6: {
          part: 0,
          index: 713
        },
        bit7: {
          part: 0,
          index: 716,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 714
        }
      },
      {
        bits6: {
          part: 0,
          index: 882
        },
        bit7: {
          part: 0,
          index: 884,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 883
        }
      },
      {
        bits6: {
          part: 1,
          index: 51
        },
        bit7: {
          part: 1,
          index: 52,
          bit: 6
        },
        bits8: {
          part: 1,
          index: 53
        }
      },
      {
        bits6: {
          part: 1,
          index: 221
        },
        bit7: {
          part: 1,
          index: 228,
          bit: 0
        },
        bits8: {
          part: 1,
          index: 222
        }
      },
      {
        bits6: {
          part: 1,
          index: 390
        },
        bit7: {
          part: 1,
          index: 396,
          bit: 1
        },
        bits8: {
          part: 1,
          index: 391
        }
      },
      {
        bits6: {
          part: 1,
          index: 559
        },
        bit7: {
          part: 1,
          index: 564,
          bit: 2
        },
        bits8: {
          part: 1,
          index: 560
        }
      }
    ],
    min: -15,
    max: 15,
    step: 0.1
  },
  {
    name: 'Mute',
    type: 'bool',
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 149
        }
      },
      {
        bits6: {
          part: 0,
          index: 290
        }
      },
      {
        bits6: {
          part: 0,
          index: 432
        }
      },
      {
        bits6: {
          part: 0,
          index: 574
        }
      },
      {
        bits6: {
          part: 0,
          index: 715
        }
      },
      {
        bits6: {
          part: 0,
          index: 885
        }
      },
      {
        bits6: {
          part: 1,
          index: 54
        }
      },
      {
        bits6: {
          part: 1,
          index: 223
        }
      },
      {
        bits6: {
          part: 1,
          index: 392
        }
      },
      {
        bits6: {
          part: 1,
          index: 561
        }
      }
    ]
  },
  {
    name: 'Is Delay On',
    type: 'bool',
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 151
        }
      },
      {
        bits6: {
          part: 0,
          index: 293
        }
      },
      {
        bits6: {
          part: 0,
          index: 434
        }
      },
      {
        bits6: {
          part: 0,
          index: 576
        }
      },
      {
        bits6: {
          part: 0,
          index: 718
        }
      },
      {
        bits6: {
          part: 0,
          index: 887
        }
      },
      {
        bits6: {
          part: 1,
          index: 56
        }
      },
      {
        bits6: {
          part: 1,
          index: 225
        }
      },
      {
        bits6: {
          part: 1,
          index: 394
        }
      },
      {
        bits6: {
          part: 1,
          index: 563
        }
      }
    ]
  },
  {
    name: 'Long Delay',
    type: 'number',
    unit: 'cm',
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 153
        },
        bit7: {
          part: 0,
          index: 156,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 154
        }
      },
      {
        bits6: {
          part: 0,
          index: 295
        },
        bit7: {
          part: 0,
          index: 300,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 296
        }
      },
      {
        bits6: {
          part: 0,
          index: 437
        },
        bit7: {
          part: 0,
          index: 444,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 438
        }
      },
      {
        bits6: {
          part: 0,
          index: 578
        },
        bit7: {
          part: 0,
          index: 580,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 579
        }
      },
      {
        bits6: {
          part: 0,
          index: 720
        },
        bit7: {
          part: 0,
          index: 724,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 721
        }
      },
      {
        bits6: {
          part: 0,
          index: 889
        },
        bit7: {
          part: 0,
          index: 892,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 890
        }
      },
      {
        bits6: {
          part: 1,
          index: 58
        },
        bit7: {
          part: 1,
          index: 60,
          bit: 5
        },
        bits8: {
          part: 1,
          index: 59
        }
      },
      {
        bits6: {
          part: 1,
          index: 227
        },
        bit7: {
          part: 1,
          index: 228,
          bit: 6
        },
        bits8: {
          part: 1,
          index: 229
        }
      },
      {
        bits6: {
          part: 1,
          index: 397
        },
        bit7: {
          part: 1,
          index: 404,
          bit: 0
        },
        bits8: {
          part: 1,
          index: 398
        }
      },
      {
        bits6: {
          part: 1,
          index: 566
        },
        bit7: {
          part: 1,
          index: 572,
          bit: 1
        },
        bits8: {
          part: 1,
          index: 567
        }
      }
    ],
    min: 0,
    max: 20000,
    step: 5
  },
  {
    name: 'Is EQ On',
    type: 'bool',
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 155
        }
      },
      {
        bits6: {
          part: 0,
          index: 297
        }
      },
      {
        bits6: {
          part: 0,
          index: 439
        }
      },
      {
        bits6: {
          part: 0,
          index: 581
        }
      },
      {
        bits6: {
          part: 0,
          index: 722
        }
      },
      {
        bits6: {
          part: 0,
          index: 891
        }
      },
      {
        bits6: {
          part: 1,
          index: 61
        }
      },
      {
        bits6: {
          part: 1,
          index: 230
        }
      },
      {
        bits6: {
          part: 1,
          index: 399
        }
      },
      {
        bits6: {
          part: 1,
          index: 568
        }
      }
    ]
  },
  {
    name: 'EQ Number',
    type: 'number',
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 158
        }
      },
      {
        bits6: {
          part: 0,
          index: 299
        }
      },
      {
        bits6: {
          part: 0,
          index: 441
        }
      },
      {
        bits6: {
          part: 0,
          index: 583
        }
      },
      {
        bits6: {
          part: 0,
          index: 725
        }
      },
      {
        bits6: {
          part: 0,
          index: 894
        }
      },
      {
        bits6: {
          part: 1,
          index: 63
        }
      },
      {
        bits6: {
          part: 1,
          index: 232
        }
      },
      {
        bits6: {
          part: 1,
          index: 401
        }
      },
      {
        bits6: {
          part: 1,
          index: 570
        }
      }
    ],
    min: 0,
    max: 9,
    step: 1
  },
  {
    name: 'EQ Index',
    type: 'number',
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 160
        }
      },
      {
        bits6: {
          part: 0,
          index: 302
        }
      },
      {
        bits6: {
          part: 0,
          index: 443
        }
      },
      {
        bits6: {
          part: 0,
          index: 585
        }
      },
      {
        bits6: {
          part: 0,
          index: 727
        }
      },
      {
        bits6: {
          part: 0,
          index: 896
        }
      },
      {
        bits6: {
          part: 1,
          index: 65
        }
      },
      {
        bits6: {
          part: 1,
          index: 234
        }
      },
      {
        bits6: {
          part: 1,
          index: 403
        }
      },
      {
        bits6: {
          part: 1,
          index: 573
        }
      }
    ],
    min: 0,
    max: 9,
    step: 1
  },
  {
    name: 'Dynamic EQ Attack',
    type: 'enum',
    unit: 'ms',
    values: constants.ATTACK_TIMES,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 162
        }
      },
      {
        bits6: {
          part: 0,
          index: 304
        }
      },
      {
        bits6: {
          part: 0,
          index: 446
        }
      },
      {
        bits6: {
          part: 0,
          index: 587
        }
      },
      {
        bits6: {
          part: 0,
          index: 729
        }
      },
      {
        bits6: {
          part: 0,
          index: 898
        }
      },
      {
        bits6: {
          part: 1,
          index: 67
        }
      },
      {
        bits6: {
          part: 1,
          index: 237
        }
      },
      {
        bits6: {
          part: 1,
          index: 406
        }
      },
      {
        bits6: {
          part: 1,
          index: 575
        }
      }
    ]
  },
  {
    name: 'Dynamic EQ Release',
    type: 'enum',
    unit: 'ms',
    values: constants.LOG_ZERO_TO_4000_MS,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 165
        },
        bit7: {
          part: 0,
          index: 172,
          bit: 0
        }
      },
      {
        bits6: {
          part: 0,
          index: 306
        },
        bit7: {
          part: 0,
          index: 308,
          bit: 5
        }
      },
      {
        bits6: {
          part: 0,
          index: 448
        },
        bit7: {
          part: 0,
          index: 452,
          bit: 3
        }
      },
      {
        bits6: {
          part: 0,
          index: 590
        },
        bit7: {
          part: 0,
          index: 596,
          bit: 1
        }
      },
      {
        bits6: {
          part: 0,
          index: 731
        },
        bit7: {
          part: 0,
          index: 732,
          bit: 6
        }
      },
      {
        bits6: {
          part: 0,
          index: 901
        },
        bit7: {
          part: 0,
          index: 908,
          bit: 0
        }
      },
      {
        bits6: {
          part: 1,
          index: 70
        },
        bit7: {
          part: 1,
          index: 76,
          bit: 1
        }
      },
      {
        bits6: {
          part: 1,
          index: 239
        },
        bit7: {
          part: 1,
          index: 244,
          bit: 2
        }
      },
      {
        bits6: {
          part: 1,
          index: 408
        },
        bit7: {
          part: 1,
          index: 412,
          bit: 3
        }
      },
      {
        bits6: {
          part: 1,
          index: 577
        },
        bit7: {
          part: 1,
          index: 580,
          bit: 4
        }
      }
    ]
  },
  {
    name: 'Dynamic EQ Ratio',
    type: 'enum',
    values: constants.EQ_RATIOS,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 167
        }
      },
      {
        bits6: {
          part: 0,
          index: 309
        }
      },
      {
        bits6: {
          part: 0,
          index: 450
        }
      },
      {
        bits6: {
          part: 0,
          index: 592
        }
      },
      {
        bits6: {
          part: 0,
          index: 734
        }
      },
      {
        bits6: {
          part: 0,
          index: 903
        }
      },
      {
        bits6: {
          part: 1,
          index: 72
        }
      },
      {
        bits6: {
          part: 1,
          index: 241
        }
      },
      {
        bits6: {
          part: 1,
          index: 410
        }
      },
      {
        bits6: {
          part: 1,
          index: 579
        }
      }
    ]
  },
  {
    name: 'Dynamic EQ Threshold',
    type: 'number',
    unit: 'dB',
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 169
        },
        bit7: {
          part: 0,
          index: 172,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 170
        }
      },
      {
        bits6: {
          part: 0,
          index: 311
        },
        bit7: {
          part: 0,
          index: 316,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 312
        }
      },
      {
        bits6: {
          part: 0,
          index: 453
        },
        bit7: {
          part: 0,
          index: 460,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 454
        }
      },
      {
        bits6: {
          part: 0,
          index: 594
        },
        bit7: {
          part: 0,
          index: 596,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 595
        }
      },
      {
        bits6: {
          part: 0,
          index: 736
        },
        bit7: {
          part: 0,
          index: 740,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 737
        }
      },
      {
        bits6: {
          part: 0,
          index: 905
        },
        bit7: {
          part: 0,
          index: 908,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 906
        }
      },
      {
        bits6: {
          part: 1,
          index: 74
        },
        bit7: {
          part: 1,
          index: 76,
          bit: 5
        },
        bits8: {
          part: 1,
          index: 75
        }
      },
      {
        bits6: {
          part: 1,
          index: 243
        },
        bit7: {
          part: 1,
          index: 244,
          bit: 6
        },
        bits8: {
          part: 1,
          index: 245
        }
      },
      {
        bits6: {
          part: 1,
          index: 413
        },
        bit7: {
          part: 1,
          index: 420,
          bit: 0
        },
        bits8: {
          part: 1,
          index: 414
        }
      },
      {
        bits6: {
          part: 1,
          index: 582
        },
        bit7: {
          part: 1,
          index: 588,
          bit: 1
        },
        bits8: {
          part: 1,
          index: 583
        }
      }
    ],
    min: -60,
    max: 0,
    step: 0.1
  },
  {
    name: 'Is Dynamic EQ On',
    type: 'bool',
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 171
        }
      },
      {
        bits6: {
          part: 0,
          index: 313
        }
      },
      {
        bits6: {
          part: 0,
          index: 455
        }
      },
      {
        bits6: {
          part: 0,
          index: 597
        }
      },
      {
        bits6: {
          part: 0,
          index: 738
        }
      },
      {
        bits6: {
          part: 0,
          index: 907
        }
      },
      {
        bits6: {
          part: 1,
          index: 77
        }
      },
      {
        bits6: {
          part: 1,
          index: 246
        }
      },
      {
        bits6: {
          part: 1,
          index: 415
        }
      },
      {
        bits6: {
          part: 1,
          index: 584
        }
      }
    ]
  },
  {
    name: 'Dynamic EQ Frequency',
    type: 'enum',
    unit: 'Hz',
    values: constants.LOG_FREQUENCY_SCALE,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 174
        },
        bit7: {
          part: 0,
          index: 180,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 175
        }
      },
      {
        bits6: {
          part: 0,
          index: 315
        },
        bit7: {
          part: 0,
          index: 316,
          bit: 6
        },
        bits8: {
          part: 0,
          index: 317
        }
      },
      {
        bits6: {
          part: 0,
          index: 457
        },
        bit7: {
          part: 0,
          index: 460,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 458
        }
      },
      {
        bits6: {
          part: 0,
          index: 599
        },
        bit7: {
          part: 0,
          index: 604,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 600
        }
      },
      {
        bits6: {
          part: 0,
          index: 741
        },
        bit7: {
          part: 0,
          index: 748,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 742
        }
      },
      {
        bits6: {
          part: 0,
          index: 910
        },
        bit7: {
          part: 0,
          index: 916,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 911
        }
      },
      {
        bits6: {
          part: 1,
          index: 79
        },
        bit7: {
          part: 1,
          index: 84,
          bit: 2
        },
        bits8: {
          part: 1,
          index: 80
        }
      },
      {
        bits6: {
          part: 1,
          index: 248
        },
        bit7: {
          part: 1,
          index: 252,
          bit: 3
        },
        bits8: {
          part: 1,
          index: 249
        }
      },
      {
        bits6: {
          part: 1,
          index: 417
        },
        bit7: {
          part: 1,
          index: 420,
          bit: 4
        },
        bits8: {
          part: 1,
          index: 418
        }
      },
      {
        bits6: {
          part: 1,
          index: 586
        },
        bit7: {
          part: 1,
          index: 588,
          bit: 5
        },
        bits8: {
          part: 1,
          index: 587
        }
      }
    ]
  },
  {
    name: 'Dynamic EQ Q',
    type: 'enum',
    values: constants.EQ_Q_VALUES,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 176
        }
      },
      {
        bits6: {
          part: 0,
          index: 318
        }
      },
      {
        bits6: {
          part: 0,
          index: 459
        }
      },
      {
        bits6: {
          part: 0,
          index: 601
        }
      },
      {
        bits6: {
          part: 0,
          index: 743
        }
      },
      {
        bits6: {
          part: 0,
          index: 912
        }
      },
      {
        bits6: {
          part: 1,
          index: 81
        }
      },
      {
        bits6: {
          part: 1,
          index: 250
        }
      },
      {
        bits6: {
          part: 1,
          index: 419
        }
      },
      {
        bits6: {
          part: 1,
          index: 589
        }
      }
    ]
  },
  {
    name: 'Dynamic EQ Gain',
    type: 'number',
    unit: 'dB',
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 178
        },
        bit7: {
          part: 0,
          index: 180,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 179
        }
      },
      {
        bits6: {
          part: 0,
          index: 320
        },
        bit7: {
          part: 0,
          index: 324,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 321
        }
      },
      {
        bits6: {
          part: 0,
          index: 462
        },
        bit7: {
          part: 0,
          index: 468,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 463
        }
      },
      {
        bits6: {
          part: 0,
          index: 603
        },
        bit7: {
          part: 0,
          index: 604,
          bit: 6
        },
        bits8: {
          part: 0,
          index: 605
        }
      },
      {
        bits6: {
          part: 0,
          index: 745
        },
        bit7: {
          part: 0,
          index: 748,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 746
        }
      },
      {
        bits6: {
          part: 0,
          index: 914
        },
        bit7: {
          part: 0,
          index: 916,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 915
        }
      },
      {
        bits6: {
          part: 1,
          index: 83
        },
        bit7: {
          part: 1,
          index: 84,
          bit: 6
        },
        bits8: {
          part: 1,
          index: 85
        }
      },
      {
        bits6: {
          part: 1,
          index: 253
        },
        bit7: {
          part: 1,
          index: 260,
          bit: 0
        },
        bits8: {
          part: 1,
          index: 254
        }
      },
      {
        bits6: {
          part: 1,
          index: 422
        },
        bit7: {
          part: 1,
          index: 428,
          bit: 1
        },
        bits8: {
          part: 1,
          index: 423
        }
      },
      {
        bits6: {
          part: 1,
          index: 591
        },
        bit7: {
          part: 1,
          index: 596,
          bit: 2
        },
        bits8: {
          part: 1,
          index: 592
        }
      }
    ],
    min: -15,
    max: 15,
    step: 0.1
  },
  {
    name: 'Dynamic EQ Type',
    type: 'enum',
    values: constants.EQ_TYPES,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 181
        }
      },
      {
        bits6: {
          part: 0,
          index: 322
        }
      },
      {
        bits6: {
          part: 0,
          index: 464
        }
      },
      {
        bits6: {
          part: 0,
          index: 606
        }
      },
      {
        bits6: {
          part: 0,
          index: 747
        }
      },
      {
        bits6: {
          part: 0,
          index: 917
        }
      },
      {
        bits6: {
          part: 1,
          index: 86
        }
      },
      {
        bits6: {
          part: 1,
          index: 255
        }
      },
      {
        bits6: {
          part: 1,
          index: 424
        }
      },
      {
        bits6: {
          part: 1,
          index: 593
        }
      }
    ]
  },
  {
    name: 'Dynamic EQ Shelving',
    type: 'enum',
    values: constants.EQ_SHELVING_SLOPES,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 183
        }
      },
      {
        bits6: {
          part: 0,
          index: 325
        }
      },
      {
        bits6: {
          part: 0,
          index: 466
        }
      },
      {
        bits6: {
          part: 0,
          index: 608
        }
      },
      {
        bits6: {
          part: 0,
          index: 750
        }
      },
      {
        bits6: {
          part: 0,
          index: 919
        }
      },
      {
        bits6: {
          part: 1,
          index: 88
        }
      },
      {
        bits6: {
          part: 1,
          index: 257
        }
      },
      {
        bits6: {
          part: 1,
          index: 426
        }
      },
      {
        bits6: {
          part: 1,
          index: 595
        }
      }
    ]
  }
];

const eqCommands = [
  {
    name: 'EQ Frequency',
    type: 'enum',
    unit: 'Hz',
    values: constants.LOG_FREQUENCY_SCALE,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 185
        },
        bit7: {
          part: 0,
          index: 188,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 186
        }
      },
      {
        bits6: {
          part: 0,
          index: 197
        },
        bit7: {
          part: 0,
          index: 204,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 198
        }
      },
      {
        bits6: {
          part: 0,
          index: 208
        },
        bit7: {
          part: 0,
          index: 212,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 209
        }
      },
      {
        bits6: {
          part: 0,
          index: 219
        },
        bit7: {
          part: 0,
          index: 220,
          bit: 6
        },
        bits8: {
          part: 0,
          index: 221
        }
      },
      {
        bits6: {
          part: 0,
          index: 231
        },
        bit7: {
          part: 0,
          index: 236,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 232
        }
      },
      {
        bits6: {
          part: 0,
          index: 242
        },
        bit7: {
          part: 0,
          index: 244,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 243
        }
      },
      {
        bits6: {
          part: 0,
          index: 254
        },
        bit7: {
          part: 0,
          index: 260,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 255
        }
      },
      {
        bits6: {
          part: 0,
          index: 265
        },
        bit7: {
          part: 0,
          index: 268,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 266
        }
      },
      {
        bits6: {
          part: 0,
          index: 277
        },
        bit7: {
          part: 0,
          index: 284,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 278
        }
      },
      {
        bits6: {
          part: 0,
          index: 327
        },
        bit7: {
          part: 0,
          index: 332,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 328
        }
      },
      {
        bits6: {
          part: 0,
          index: 338
        },
        bit7: {
          part: 0,
          index: 340,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 339
        }
      },
      {
        bits6: {
          part: 0,
          index: 350
        },
        bit7: {
          part: 0,
          index: 356,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 351
        }
      },
      {
        bits6: {
          part: 0,
          index: 361
        },
        bit7: {
          part: 0,
          index: 364,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 362
        }
      },
      {
        bits6: {
          part: 0,
          index: 373
        },
        bit7: {
          part: 0,
          index: 380,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 374
        }
      },
      {
        bits6: {
          part: 0,
          index: 384
        },
        bit7: {
          part: 0,
          index: 388,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 385
        }
      },
      {
        bits6: {
          part: 0,
          index: 395
        },
        bit7: {
          part: 0,
          index: 396,
          bit: 6
        },
        bits8: {
          part: 0,
          index: 397
        }
      },
      {
        bits6: {
          part: 0,
          index: 407
        },
        bit7: {
          part: 0,
          index: 412,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 408
        }
      },
      {
        bits6: {
          part: 0,
          index: 418
        },
        bit7: {
          part: 0,
          index: 420,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 419
        }
      },
      {
        bits6: {
          part: 0,
          index: 469
        },
        bit7: {
          part: 0,
          index: 476,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 470
        }
      },
      {
        bits6: {
          part: 0,
          index: 480
        },
        bit7: {
          part: 0,
          index: 484,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 481
        }
      },
      {
        bits6: {
          part: 0,
          index: 491
        },
        bit7: {
          part: 0,
          index: 492,
          bit: 6
        },
        bits8: {
          part: 0,
          index: 493
        }
      },
      {
        bits6: {
          part: 0,
          index: 503
        },
        bit7: {
          part: 0,
          index: 508,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 504
        }
      },
      {
        bits6: {
          part: 0,
          index: 514
        },
        bit7: {
          part: 0,
          index: 516,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 515
        }
      },
      {
        bits6: {
          part: 0,
          index: 526
        },
        bit7: {
          part: 0,
          index: 532,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 527
        }
      },
      {
        bits6: {
          part: 0,
          index: 537
        },
        bit7: {
          part: 0,
          index: 540,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 538
        }
      },
      {
        bits6: {
          part: 0,
          index: 549
        },
        bit7: {
          part: 0,
          index: 556,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 550
        }
      },
      {
        bits6: {
          part: 0,
          index: 560
        },
        bit7: {
          part: 0,
          index: 564,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 561
        }
      },
      {
        bits6: {
          part: 0,
          index: 610
        },
        bit7: {
          part: 0,
          index: 612,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 611
        }
      },
      {
        bits6: {
          part: 0,
          index: 622
        },
        bit7: {
          part: 0,
          index: 628,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 623
        }
      },
      {
        bits6: {
          part: 0,
          index: 633
        },
        bit7: {
          part: 0,
          index: 636,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 634
        }
      },
      {
        bits6: {
          part: 0,
          index: 645
        },
        bit7: {
          part: 0,
          index: 652,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 646
        }
      },
      {
        bits6: {
          part: 0,
          index: 656
        },
        bit7: {
          part: 0,
          index: 660,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 657
        }
      },
      {
        bits6: {
          part: 0,
          index: 667
        },
        bit7: {
          part: 0,
          index: 668,
          bit: 6
        },
        bits8: {
          part: 0,
          index: 669
        }
      },
      {
        bits6: {
          part: 0,
          index: 679
        },
        bit7: {
          part: 0,
          index: 684,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 680
        }
      },
      {
        bits6: {
          part: 0,
          index: 690
        },
        bit7: {
          part: 0,
          index: 692,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 691
        }
      },
      {
        bits6: {
          part: 0,
          index: 702
        },
        bit7: {
          part: 0,
          index: 708,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 703
        }
      },
      {
        bits6: {
          part: 0,
          index: 752
        },
        bit7: {
          part: 0,
          index: 756,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 753
        }
      },
      {
        bits6: {
          part: 0,
          index: 763
        },
        bit7: {
          part: 0,
          index: 764,
          bit: 6
        },
        bits8: {
          part: 0,
          index: 765
        }
      },
      {
        bits6: {
          part: 0,
          index: 775
        },
        bit7: {
          part: 0,
          index: 780,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 776
        }
      },
      {
        bits6: {
          part: 0,
          index: 786
        },
        bit7: {
          part: 0,
          index: 788,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 787
        }
      },
      {
        bits6: {
          part: 0,
          index: 798
        },
        bit7: {
          part: 0,
          index: 804,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 799
        }
      },
      {
        bits6: {
          part: 0,
          index: 809
        },
        bit7: {
          part: 0,
          index: 812,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 810
        }
      },
      {
        bits6: {
          part: 0,
          index: 821
        },
        bit7: {
          part: 0,
          index: 828,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 822
        }
      },
      {
        bits6: {
          part: 0,
          index: 832
        },
        bit7: {
          part: 0,
          index: 836,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 833
        }
      },
      {
        bits6: {
          part: 0,
          index: 843
        },
        bit7: {
          part: 0,
          index: 844,
          bit: 6
        },
        bits8: {
          part: 0,
          index: 845
        }
      },
      {
        bits6: {
          part: 0,
          index: 921
        },
        bit7: {
          part: 0,
          index: 924,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 922
        }
      },
      {
        bits6: {
          part: 0,
          index: 933
        },
        bit7: {
          part: 0,
          index: 940,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 934
        }
      },
      {
        bits6: {
          part: 0,
          index: 944
        },
        bit7: {
          part: 0,
          index: 948,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 945
        }
      },
      {
        bits6: {
          part: 0,
          index: 955
        },
        bit7: {
          part: 0,
          index: 956,
          bit: 6
        },
        bits8: {
          part: 0,
          index: 957
        }
      },
      {
        bits6: {
          part: 0,
          index: 967
        },
        bit7: {
          part: 0,
          index: 972,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 968
        }
      },
      {
        bits6: {
          part: 0,
          index: 978
        },
        bit7: {
          part: 0,
          index: 980,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 979
        }
      },
      {
        bits6: {
          part: 0,
          index: 990
        },
        bit7: {
          part: 0,
          index: 996,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 991
        }
      },
      {
        bits6: {
          part: 0,
          index: 1001
        },
        bit7: {
          part: 0,
          index: 1004,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 1002
        }
      },
      {
        bits6: {
          part: 1,
          index: 13
        },
        bit7: {
          part: 1,
          index: 20,
          bit: 0
        },
        bits8: {
          part: 1,
          index: 14
        }
      },
      {
        bits6: {
          part: 1,
          index: 90
        },
        bit7: {
          part: 1,
          index: 92,
          bit: 5
        },
        bits8: {
          part: 1,
          index: 91
        }
      },
      {
        bits6: {
          part: 1,
          index: 102
        },
        bit7: {
          part: 1,
          index: 108,
          bit: 1
        },
        bits8: {
          part: 1,
          index: 103
        }
      },
      {
        bits6: {
          part: 1,
          index: 113
        },
        bit7: {
          part: 1,
          index: 116,
          bit: 4
        },
        bits8: {
          part: 1,
          index: 114
        }
      },
      {
        bits6: {
          part: 1,
          index: 125
        },
        bit7: {
          part: 1,
          index: 132,
          bit: 0
        },
        bits8: {
          part: 1,
          index: 126
        }
      },
      {
        bits6: {
          part: 1,
          index: 136
        },
        bit7: {
          part: 1,
          index: 140,
          bit: 3
        },
        bits8: {
          part: 1,
          index: 137
        }
      },
      {
        bits6: {
          part: 1,
          index: 147
        },
        bit7: {
          part: 1,
          index: 148,
          bit: 6
        },
        bits8: {
          part: 1,
          index: 149
        }
      },
      {
        bits6: {
          part: 1,
          index: 159
        },
        bit7: {
          part: 1,
          index: 164,
          bit: 2
        },
        bits8: {
          part: 1,
          index: 160
        }
      },
      {
        bits6: {
          part: 1,
          index: 170
        },
        bit7: {
          part: 1,
          index: 172,
          bit: 5
        },
        bits8: {
          part: 1,
          index: 171
        }
      },
      {
        bits6: {
          part: 1,
          index: 182
        },
        bit7: {
          part: 1,
          index: 188,
          bit: 1
        },
        bits8: {
          part: 1,
          index: 183
        }
      },
      {
        bits6: {
          part: 1,
          index: 259
        },
        bit7: {
          part: 1,
          index: 260,
          bit: 6
        },
        bits8: {
          part: 1,
          index: 261
        }
      },
      {
        bits6: {
          part: 1,
          index: 271
        },
        bit7: {
          part: 1,
          index: 276,
          bit: 2
        },
        bits8: {
          part: 1,
          index: 272
        }
      },
      {
        bits6: {
          part: 1,
          index: 282
        },
        bit7: {
          part: 1,
          index: 284,
          bit: 5
        },
        bits8: {
          part: 1,
          index: 283
        }
      },
      {
        bits6: {
          part: 1,
          index: 294
        },
        bit7: {
          part: 1,
          index: 300,
          bit: 1
        },
        bits8: {
          part: 1,
          index: 295
        }
      },
      {
        bits6: {
          part: 1,
          index: 305
        },
        bit7: {
          part: 1,
          index: 308,
          bit: 4
        },
        bits8: {
          part: 1,
          index: 306
        }
      },
      {
        bits6: {
          part: 1,
          index: 317
        },
        bit7: {
          part: 1,
          index: 324,
          bit: 0
        },
        bits8: {
          part: 1,
          index: 318
        }
      },
      {
        bits6: {
          part: 1,
          index: 328
        },
        bit7: {
          part: 1,
          index: 332,
          bit: 3
        },
        bits8: {
          part: 1,
          index: 329
        }
      },
      {
        bits6: {
          part: 1,
          index: 339
        },
        bit7: {
          part: 1,
          index: 340,
          bit: 6
        },
        bits8: {
          part: 1,
          index: 341
        }
      },
      {
        bits6: {
          part: 1,
          index: 351
        },
        bit7: {
          part: 1,
          index: 356,
          bit: 2
        },
        bits8: {
          part: 1,
          index: 352
        }
      },
      {
        bits6: {
          part: 1,
          index: 429
        },
        bit7: {
          part: 1,
          index: 436,
          bit: 0
        },
        bits8: {
          part: 1,
          index: 430
        }
      },
      {
        bits6: {
          part: 1,
          index: 440
        },
        bit7: {
          part: 1,
          index: 444,
          bit: 3
        },
        bits8: {
          part: 1,
          index: 441
        }
      },
      {
        bits6: {
          part: 1,
          index: 451
        },
        bit7: {
          part: 1,
          index: 452,
          bit: 6
        },
        bits8: {
          part: 1,
          index: 453
        }
      },
      {
        bits6: {
          part: 1,
          index: 463
        },
        bit7: {
          part: 1,
          index: 468,
          bit: 2
        },
        bits8: {
          part: 1,
          index: 464
        }
      },
      {
        bits6: {
          part: 1,
          index: 474
        },
        bit7: {
          part: 1,
          index: 476,
          bit: 5
        },
        bits8: {
          part: 1,
          index: 475
        }
      },
      {
        bits6: {
          part: 1,
          index: 486
        },
        bit7: {
          part: 1,
          index: 492,
          bit: 1
        },
        bits8: {
          part: 1,
          index: 487
        }
      },
      {
        bits6: {
          part: 1,
          index: 497
        },
        bit7: {
          part: 1,
          index: 500,
          bit: 4
        },
        bits8: {
          part: 1,
          index: 498
        }
      },
      {
        bits6: {
          part: 1,
          index: 509
        },
        bit7: {
          part: 1,
          index: 516,
          bit: 0
        },
        bits8: {
          part: 1,
          index: 510
        }
      },
      {
        bits6: {
          part: 1,
          index: 520
        },
        bit7: {
          part: 1,
          index: 524,
          bit: 3
        },
        bits8: {
          part: 1,
          index: 521
        }
      },
      {
        bits6: {
          part: 1,
          index: 598
        },
        bit7: {
          part: 1,
          index: 604,
          bit: 1
        },
        bits8: {
          part: 1,
          index: 599
        }
      },
      {
        bits6: {
          part: 1,
          index: 609
        },
        bit7: {
          part: 1,
          index: 612,
          bit: 4
        },
        bits8: {
          part: 1,
          index: 610
        }
      },
      {
        bits6: {
          part: 1,
          index: 621
        },
        bit7: {
          part: 1,
          index: 628,
          bit: 0
        },
        bits8: {
          part: 1,
          index: 622
        }
      },
      {
        bits6: {
          part: 1,
          index: 632
        },
        bit7: {
          part: 1,
          index: 636,
          bit: 3
        },
        bits8: {
          part: 1,
          index: 633
        }
      },
      {
        bits6: {
          part: 1,
          index: 643
        },
        bit7: {
          part: 1,
          index: 644,
          bit: 6
        },
        bits8: {
          part: 1,
          index: 645
        }
      },
      {
        bits6: {
          part: 1,
          index: 655
        },
        bit7: {
          part: 1,
          index: 660,
          bit: 2
        },
        bits8: {
          part: 1,
          index: 656
        }
      },
      {
        bits6: {
          part: 1,
          index: 666
        },
        bit7: {
          part: 1,
          index: 668,
          bit: 5
        },
        bits8: {
          part: 1,
          index: 667
        }
      },
      {
        bits6: {
          part: 1,
          index: 678
        },
        bit7: {
          part: 1,
          index: 684,
          bit: 1
        },
        bits8: {
          part: 1,
          index: 679
        }
      },
      {
        bits6: {
          part: 1,
          index: 689
        },
        bit7: {
          part: 1,
          index: 692,
          bit: 4
        },
        bits8: {
          part: 1,
          index: 690
        }
      }
    ]
  },
  {
    name: 'EQ Q',
    type: 'enum',
    values: constants.EQ_Q_VALUES,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 187
        }
      },
      {
        bits6: {
          part: 0,
          index: 199
        }
      },
      {
        bits6: {
          part: 0,
          index: 210
        }
      },
      {
        bits6: {
          part: 0,
          index: 222
        }
      },
      {
        bits6: {
          part: 0,
          index: 233
        }
      },
      {
        bits6: {
          part: 0,
          index: 245
        }
      },
      {
        bits6: {
          part: 0,
          index: 256
        }
      },
      {
        bits6: {
          part: 0,
          index: 267
        }
      },
      {
        bits6: {
          part: 0,
          index: 279
        }
      },
      {
        bits6: {
          part: 0,
          index: 329
        }
      },
      {
        bits6: {
          part: 0,
          index: 341
        }
      },
      {
        bits6: {
          part: 0,
          index: 352
        }
      },
      {
        bits6: {
          part: 0,
          index: 363
        }
      },
      {
        bits6: {
          part: 0,
          index: 375
        }
      },
      {
        bits6: {
          part: 0,
          index: 386
        }
      },
      {
        bits6: {
          part: 0,
          index: 398
        }
      },
      {
        bits6: {
          part: 0,
          index: 409
        }
      },
      {
        bits6: {
          part: 0,
          index: 421
        }
      },
      {
        bits6: {
          part: 0,
          index: 471
        }
      },
      {
        bits6: {
          part: 0,
          index: 482
        }
      },
      {
        bits6: {
          part: 0,
          index: 494
        }
      },
      {
        bits6: {
          part: 0,
          index: 505
        }
      },
      {
        bits6: {
          part: 0,
          index: 517
        }
      },
      {
        bits6: {
          part: 0,
          index: 528
        }
      },
      {
        bits6: {
          part: 0,
          index: 539
        }
      },
      {
        bits6: {
          part: 0,
          index: 551
        }
      },
      {
        bits6: {
          part: 0,
          index: 562
        }
      },
      {
        bits6: {
          part: 0,
          index: 613
        }
      },
      {
        bits6: {
          part: 0,
          index: 624
        }
      },
      {
        bits6: {
          part: 0,
          index: 635
        }
      },
      {
        bits6: {
          part: 0,
          index: 647
        }
      },
      {
        bits6: {
          part: 0,
          index: 658
        }
      },
      {
        bits6: {
          part: 0,
          index: 670
        }
      },
      {
        bits6: {
          part: 0,
          index: 681
        }
      },
      {
        bits6: {
          part: 0,
          index: 693
        }
      },
      {
        bits6: {
          part: 0,
          index: 704
        }
      },
      {
        bits6: {
          part: 0,
          index: 754
        }
      },
      {
        bits6: {
          part: 0,
          index: 766
        }
      },
      {
        bits6: {
          part: 0,
          index: 777
        }
      },
      {
        bits6: {
          part: 0,
          index: 789
        }
      },
      {
        bits6: {
          part: 0,
          index: 800
        }
      },
      {
        bits6: {
          part: 0,
          index: 811
        }
      },
      {
        bits6: {
          part: 0,
          index: 823
        }
      },
      {
        bits6: {
          part: 0,
          index: 834
        }
      },
      {
        bits6: {
          part: 0,
          index: 846
        }
      },
      {
        bits6: {
          part: 0,
          index: 923
        }
      },
      {
        bits6: {
          part: 0,
          index: 935
        }
      },
      {
        bits6: {
          part: 0,
          index: 946
        }
      },
      {
        bits6: {
          part: 0,
          index: 958
        }
      },
      {
        bits6: {
          part: 0,
          index: 969
        }
      },
      {
        bits6: {
          part: 0,
          index: 981
        }
      },
      {
        bits6: {
          part: 0,
          index: 992
        }
      },
      {
        bits6: {
          part: 0,
          index: 1003
        }
      },
      {
        bits6: {
          part: 1,
          index: 15
        }
      },
      {
        bits6: {
          part: 1,
          index: 93
        }
      },
      {
        bits6: {
          part: 1,
          index: 104
        }
      },
      {
        bits6: {
          part: 1,
          index: 115
        }
      },
      {
        bits6: {
          part: 1,
          index: 127
        }
      },
      {
        bits6: {
          part: 1,
          index: 138
        }
      },
      {
        bits6: {
          part: 1,
          index: 150
        }
      },
      {
        bits6: {
          part: 1,
          index: 161
        }
      },
      {
        bits6: {
          part: 1,
          index: 173
        }
      },
      {
        bits6: {
          part: 1,
          index: 184
        }
      },
      {
        bits6: {
          part: 1,
          index: 262
        }
      },
      {
        bits6: {
          part: 1,
          index: 273
        }
      },
      {
        bits6: {
          part: 1,
          index: 285
        }
      },
      {
        bits6: {
          part: 1,
          index: 296
        }
      },
      {
        bits6: {
          part: 1,
          index: 307
        }
      },
      {
        bits6: {
          part: 1,
          index: 319
        }
      },
      {
        bits6: {
          part: 1,
          index: 330
        }
      },
      {
        bits6: {
          part: 1,
          index: 342
        }
      },
      {
        bits6: {
          part: 1,
          index: 353
        }
      },
      {
        bits6: {
          part: 1,
          index: 431
        }
      },
      {
        bits6: {
          part: 1,
          index: 442
        }
      },
      {
        bits6: {
          part: 1,
          index: 454
        }
      },
      {
        bits6: {
          part: 1,
          index: 465
        }
      },
      {
        bits6: {
          part: 1,
          index: 477
        }
      },
      {
        bits6: {
          part: 1,
          index: 488
        }
      },
      {
        bits6: {
          part: 1,
          index: 499
        }
      },
      {
        bits6: {
          part: 1,
          index: 511
        }
      },
      {
        bits6: {
          part: 1,
          index: 522
        }
      },
      {
        bits6: {
          part: 1,
          index: 600
        }
      },
      {
        bits6: {
          part: 1,
          index: 611
        }
      },
      {
        bits6: {
          part: 1,
          index: 623
        }
      },
      {
        bits6: {
          part: 1,
          index: 634
        }
      },
      {
        bits6: {
          part: 1,
          index: 646
        }
      },
      {
        bits6: {
          part: 1,
          index: 657
        }
      },
      {
        bits6: {
          part: 1,
          index: 669
        }
      },
      {
        bits6: {
          part: 1,
          index: 680
        }
      },
      {
        bits6: {
          part: 1,
          index: 691
        }
      }
    ]
  },
  {
    name: 'EQ Gain',
    type: 'number',
    unit: 'dB',
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 190
        },
        bit7: {
          part: 0,
          index: 196,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 191
        }
      },
      {
        bits6: {
          part: 0,
          index: 201
        },
        bit7: {
          part: 0,
          index: 204,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 202
        }
      },
      {
        bits6: {
          part: 0,
          index: 213
        },
        bit7: {
          part: 0,
          index: 220,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 214
        }
      },
      {
        bits6: {
          part: 0,
          index: 224
        },
        bit7: {
          part: 0,
          index: 228,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 225
        }
      },
      {
        bits6: {
          part: 0,
          index: 235
        },
        bit7: {
          part: 0,
          index: 236,
          bit: 6
        },
        bits8: {
          part: 0,
          index: 237
        }
      },
      {
        bits6: {
          part: 0,
          index: 247
        },
        bit7: {
          part: 0,
          index: 252,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 248
        }
      },
      {
        bits6: {
          part: 0,
          index: 258
        },
        bit7: {
          part: 0,
          index: 260,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 259
        }
      },
      {
        bits6: {
          part: 0,
          index: 270
        },
        bit7: {
          part: 0,
          index: 276,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 271
        }
      },
      {
        bits6: {
          part: 0,
          index: 281
        },
        bit7: {
          part: 0,
          index: 284,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 282
        }
      },
      {
        bits6: {
          part: 0,
          index: 331
        },
        bit7: {
          part: 0,
          index: 332,
          bit: 6
        },
        bits8: {
          part: 0,
          index: 333
        }
      },
      {
        bits6: {
          part: 0,
          index: 343
        },
        bit7: {
          part: 0,
          index: 348,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 344
        }
      },
      {
        bits6: {
          part: 0,
          index: 354
        },
        bit7: {
          part: 0,
          index: 356,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 355
        }
      },
      {
        bits6: {
          part: 0,
          index: 366
        },
        bit7: {
          part: 0,
          index: 372,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 367
        }
      },
      {
        bits6: {
          part: 0,
          index: 377
        },
        bit7: {
          part: 0,
          index: 380,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 378
        }
      },
      {
        bits6: {
          part: 0,
          index: 389
        },
        bit7: {
          part: 0,
          index: 396,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 390
        }
      },
      {
        bits6: {
          part: 0,
          index: 400
        },
        bit7: {
          part: 0,
          index: 404,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 401
        }
      },
      {
        bits6: {
          part: 0,
          index: 411
        },
        bit7: {
          part: 0,
          index: 412,
          bit: 6
        },
        bits8: {
          part: 0,
          index: 413
        }
      },
      {
        bits6: {
          part: 0,
          index: 423
        },
        bit7: {
          part: 0,
          index: 428,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 424
        }
      },
      {
        bits6: {
          part: 0,
          index: 473
        },
        bit7: {
          part: 0,
          index: 476,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 474
        }
      },
      {
        bits6: {
          part: 0,
          index: 485
        },
        bit7: {
          part: 0,
          index: 492,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 486
        }
      },
      {
        bits6: {
          part: 0,
          index: 496
        },
        bit7: {
          part: 0,
          index: 500,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 497
        }
      },
      {
        bits6: {
          part: 0,
          index: 507
        },
        bit7: {
          part: 0,
          index: 508,
          bit: 6
        },
        bits8: {
          part: 0,
          index: 509
        }
      },
      {
        bits6: {
          part: 0,
          index: 519
        },
        bit7: {
          part: 0,
          index: 524,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 520
        }
      },
      {
        bits6: {
          part: 0,
          index: 530
        },
        bit7: {
          part: 0,
          index: 532,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 531
        }
      },
      {
        bits6: {
          part: 0,
          index: 542
        },
        bit7: {
          part: 0,
          index: 548,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 543
        }
      },
      {
        bits6: {
          part: 0,
          index: 553
        },
        bit7: {
          part: 0,
          index: 556,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 554
        }
      },
      {
        bits6: {
          part: 0,
          index: 565
        },
        bit7: {
          part: 0,
          index: 572,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 566
        }
      },
      {
        bits6: {
          part: 0,
          index: 615
        },
        bit7: {
          part: 0,
          index: 620,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 616
        }
      },
      {
        bits6: {
          part: 0,
          index: 626
        },
        bit7: {
          part: 0,
          index: 628,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 627
        }
      },
      {
        bits6: {
          part: 0,
          index: 638
        },
        bit7: {
          part: 0,
          index: 644,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 639
        }
      },
      {
        bits6: {
          part: 0,
          index: 649
        },
        bit7: {
          part: 0,
          index: 652,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 650
        }
      },
      {
        bits6: {
          part: 0,
          index: 661
        },
        bit7: {
          part: 0,
          index: 668,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 662
        }
      },
      {
        bits6: {
          part: 0,
          index: 672
        },
        bit7: {
          part: 0,
          index: 676,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 673
        }
      },
      {
        bits6: {
          part: 0,
          index: 683
        },
        bit7: {
          part: 0,
          index: 684,
          bit: 6
        },
        bits8: {
          part: 0,
          index: 685
        }
      },
      {
        bits6: {
          part: 0,
          index: 695
        },
        bit7: {
          part: 0,
          index: 700,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 696
        }
      },
      {
        bits6: {
          part: 0,
          index: 706
        },
        bit7: {
          part: 0,
          index: 708,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 707
        }
      },
      {
        bits6: {
          part: 0,
          index: 757
        },
        bit7: {
          part: 0,
          index: 764,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 758
        }
      },
      {
        bits6: {
          part: 0,
          index: 768
        },
        bit7: {
          part: 0,
          index: 772,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 769
        }
      },
      {
        bits6: {
          part: 0,
          index: 779
        },
        bit7: {
          part: 0,
          index: 780,
          bit: 6
        },
        bits8: {
          part: 0,
          index: 781
        }
      },
      {
        bits6: {
          part: 0,
          index: 791
        },
        bit7: {
          part: 0,
          index: 796,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 792
        }
      },
      {
        bits6: {
          part: 0,
          index: 802
        },
        bit7: {
          part: 0,
          index: 804,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 803
        }
      },
      {
        bits6: {
          part: 0,
          index: 814
        },
        bit7: {
          part: 0,
          index: 820,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 815
        }
      },
      {
        bits6: {
          part: 0,
          index: 825
        },
        bit7: {
          part: 0,
          index: 828,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 826
        }
      },
      {
        bits6: {
          part: 0,
          index: 837
        },
        bit7: {
          part: 0,
          index: 844,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 838
        }
      },
      {
        bits6: {
          part: 0,
          index: 848
        },
        bit7: {
          part: 0,
          index: 852,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 849
        }
      },
      {
        bits6: {
          part: 0,
          index: 926
        },
        bit7: {
          part: 0,
          index: 932,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 927
        }
      },
      {
        bits6: {
          part: 0,
          index: 937
        },
        bit7: {
          part: 0,
          index: 940,
          bit: 4
        },
        bits8: {
          part: 0,
          index: 938
        }
      },
      {
        bits6: {
          part: 0,
          index: 949
        },
        bit7: {
          part: 0,
          index: 956,
          bit: 0
        },
        bits8: {
          part: 0,
          index: 950
        }
      },
      {
        bits6: {
          part: 0,
          index: 960
        },
        bit7: {
          part: 0,
          index: 964,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 961
        }
      },
      {
        bits6: {
          part: 0,
          index: 971
        },
        bit7: {
          part: 0,
          index: 972,
          bit: 6
        },
        bits8: {
          part: 0,
          index: 973
        }
      },
      {
        bits6: {
          part: 0,
          index: 983
        },
        bit7: {
          part: 0,
          index: 988,
          bit: 2
        },
        bits8: {
          part: 0,
          index: 984
        }
      },
      {
        bits6: {
          part: 0,
          index: 994
        },
        bit7: {
          part: 0,
          index: 996,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 995
        }
      },
      {
        bits6: {
          part: 0,
          index: 1006
        },
        bit7: {
          part: 0,
          index: 1012,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 1007
        }
      },
      {
        bits6: {
          part: 1,
          index: 17
        },
        bit7: {
          part: 1,
          index: 20,
          bit: 4
        },
        bits8: {
          part: 1,
          index: 18
        }
      },
      {
        bits6: {
          part: 1,
          index: 95
        },
        bit7: {
          part: 1,
          index: 100,
          bit: 2
        },
        bits8: {
          part: 1,
          index: 96
        }
      },
      {
        bits6: {
          part: 1,
          index: 106
        },
        bit7: {
          part: 1,
          index: 108,
          bit: 5
        },
        bits8: {
          part: 1,
          index: 107
        }
      },
      {
        bits6: {
          part: 1,
          index: 118
        },
        bit7: {
          part: 1,
          index: 124,
          bit: 1
        },
        bits8: {
          part: 1,
          index: 119
        }
      },
      {
        bits6: {
          part: 1,
          index: 129
        },
        bit7: {
          part: 1,
          index: 132,
          bit: 4
        },
        bits8: {
          part: 1,
          index: 130
        }
      },
      {
        bits6: {
          part: 1,
          index: 141
        },
        bit7: {
          part: 1,
          index: 148,
          bit: 0
        },
        bits8: {
          part: 1,
          index: 142
        }
      },
      {
        bits6: {
          part: 1,
          index: 152
        },
        bit7: {
          part: 1,
          index: 156,
          bit: 3
        },
        bits8: {
          part: 1,
          index: 153
        }
      },
      {
        bits6: {
          part: 1,
          index: 163
        },
        bit7: {
          part: 1,
          index: 164,
          bit: 6
        },
        bits8: {
          part: 1,
          index: 165
        }
      },
      {
        bits6: {
          part: 1,
          index: 175
        },
        bit7: {
          part: 1,
          index: 180,
          bit: 2
        },
        bits8: {
          part: 1,
          index: 176
        }
      },
      {
        bits6: {
          part: 1,
          index: 186
        },
        bit7: {
          part: 1,
          index: 188,
          bit: 5
        },
        bits8: {
          part: 1,
          index: 187
        }
      },
      {
        bits6: {
          part: 1,
          index: 264
        },
        bit7: {
          part: 1,
          index: 268,
          bit: 3
        },
        bits8: {
          part: 1,
          index: 265
        }
      },
      {
        bits6: {
          part: 1,
          index: 275
        },
        bit7: {
          part: 1,
          index: 276,
          bit: 6
        },
        bits8: {
          part: 1,
          index: 277
        }
      },
      {
        bits6: {
          part: 1,
          index: 287
        },
        bit7: {
          part: 1,
          index: 292,
          bit: 2
        },
        bits8: {
          part: 1,
          index: 288
        }
      },
      {
        bits6: {
          part: 1,
          index: 298
        },
        bit7: {
          part: 1,
          index: 300,
          bit: 5
        },
        bits8: {
          part: 1,
          index: 299
        }
      },
      {
        bits6: {
          part: 1,
          index: 310
        },
        bit7: {
          part: 1,
          index: 316,
          bit: 1
        },
        bits8: {
          part: 1,
          index: 311
        }
      },
      {
        bits6: {
          part: 1,
          index: 321
        },
        bit7: {
          part: 1,
          index: 324,
          bit: 4
        },
        bits8: {
          part: 1,
          index: 322
        }
      },
      {
        bits6: {
          part: 1,
          index: 333
        },
        bit7: {
          part: 1,
          index: 340,
          bit: 0
        },
        bits8: {
          part: 1,
          index: 334
        }
      },
      {
        bits6: {
          part: 1,
          index: 344
        },
        bit7: {
          part: 1,
          index: 348,
          bit: 3
        },
        bits8: {
          part: 1,
          index: 345
        }
      },
      {
        bits6: {
          part: 1,
          index: 355
        },
        bit7: {
          part: 1,
          index: 356,
          bit: 6
        },
        bits8: {
          part: 1,
          index: 357
        }
      },
      {
        bits6: {
          part: 1,
          index: 433
        },
        bit7: {
          part: 1,
          index: 436,
          bit: 4
        },
        bits8: {
          part: 1,
          index: 434
        }
      },
      {
        bits6: {
          part: 1,
          index: 445
        },
        bit7: {
          part: 1,
          index: 452,
          bit: 0
        },
        bits8: {
          part: 1,
          index: 446
        }
      },
      {
        bits6: {
          part: 1,
          index: 456
        },
        bit7: {
          part: 1,
          index: 460,
          bit: 3
        },
        bits8: {
          part: 1,
          index: 457
        }
      },
      {
        bits6: {
          part: 1,
          index: 467
        },
        bit7: {
          part: 1,
          index: 468,
          bit: 6
        },
        bits8: {
          part: 1,
          index: 469
        }
      },
      {
        bits6: {
          part: 1,
          index: 479
        },
        bit7: {
          part: 1,
          index: 484,
          bit: 2
        },
        bits8: {
          part: 1,
          index: 480
        }
      },
      {
        bits6: {
          part: 1,
          index: 490
        },
        bit7: {
          part: 1,
          index: 492,
          bit: 5
        },
        bits8: {
          part: 1,
          index: 491
        }
      },
      {
        bits6: {
          part: 1,
          index: 502
        },
        bit7: {
          part: 1,
          index: 508,
          bit: 1
        },
        bits8: {
          part: 1,
          index: 503
        }
      },
      {
        bits6: {
          part: 1,
          index: 513
        },
        bit7: {
          part: 1,
          index: 516,
          bit: 4
        },
        bits8: {
          part: 1,
          index: 514
        }
      },
      {
        bits6: {
          part: 1,
          index: 525
        },
        bit7: {
          part: 1,
          index: 532,
          bit: 0
        },
        bits8: {
          part: 1,
          index: 526
        }
      },
      {
        bits6: {
          part: 1,
          index: 602
        },
        bit7: {
          part: 1,
          index: 604,
          bit: 5
        },
        bits8: {
          part: 1,
          index: 603
        }
      },
      {
        bits6: {
          part: 1,
          index: 614
        },
        bit7: {
          part: 1,
          index: 620,
          bit: 1
        },
        bits8: {
          part: 1,
          index: 615
        }
      },
      {
        bits6: {
          part: 1,
          index: 625
        },
        bit7: {
          part: 1,
          index: 628,
          bit: 4
        },
        bits8: {
          part: 1,
          index: 626
        }
      },
      {
        bits6: {
          part: 1,
          index: 637
        },
        bit7: {
          part: 1,
          index: 644,
          bit: 0
        },
        bits8: {
          part: 1,
          index: 638
        }
      },
      {
        bits6: {
          part: 1,
          index: 648
        },
        bit7: {
          part: 1,
          index: 652,
          bit: 3
        },
        bits8: {
          part: 1,
          index: 649
        }
      },
      {
        bits6: {
          part: 1,
          index: 659
        },
        bit7: {
          part: 1,
          index: 660,
          bit: 6
        },
        bits8: {
          part: 1,
          index: 661
        }
      },
      {
        bits6: {
          part: 1,
          index: 671
        },
        bit7: {
          part: 1,
          index: 676,
          bit: 2
        },
        bits8: {
          part: 1,
          index: 672
        }
      },
      {
        bits6: {
          part: 1,
          index: 682
        },
        bit7: {
          part: 1,
          index: 684,
          bit: 5
        },
        bits8: {
          part: 1,
          index: 683
        }
      },
      {
        bits6: {
          part: 1,
          index: 694
        },
        bit7: {
          part: 1,
          index: 700,
          bit: 1
        },
        bits8: {
          part: 1,
          index: 695
        }
      }
    ],
    min: -15,
    max: 15,
    step: 0.1
  },
  {
    name: 'EQ Type',
    type: 'enum',
    values: constants.EQ_TYPES,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 192
        }
      },
      {
        bits6: {
          part: 0,
          index: 203
        }
      },
      {
        bits6: {
          part: 0,
          index: 215
        }
      },
      {
        bits6: {
          part: 0,
          index: 226
        }
      },
      {
        bits6: {
          part: 0,
          index: 238
        }
      },
      {
        bits6: {
          part: 0,
          index: 249
        }
      },
      {
        bits6: {
          part: 0,
          index: 261
        }
      },
      {
        bits6: {
          part: 0,
          index: 272
        }
      },
      {
        bits6: {
          part: 0,
          index: 283
        }
      },
      {
        bits6: {
          part: 0,
          index: 334
        }
      },
      {
        bits6: {
          part: 0,
          index: 345
        }
      },
      {
        bits6: {
          part: 0,
          index: 357
        }
      },
      {
        bits6: {
          part: 0,
          index: 368
        }
      },
      {
        bits6: {
          part: 0,
          index: 379
        }
      },
      {
        bits6: {
          part: 0,
          index: 391
        }
      },
      {
        bits6: {
          part: 0,
          index: 402
        }
      },
      {
        bits6: {
          part: 0,
          index: 414
        }
      },
      {
        bits6: {
          part: 0,
          index: 425
        }
      },
      {
        bits6: {
          part: 0,
          index: 475
        }
      },
      {
        bits6: {
          part: 0,
          index: 487
        }
      },
      {
        bits6: {
          part: 0,
          index: 498
        }
      },
      {
        bits6: {
          part: 0,
          index: 510
        }
      },
      {
        bits6: {
          part: 0,
          index: 521
        }
      },
      {
        bits6: {
          part: 0,
          index: 533
        }
      },
      {
        bits6: {
          part: 0,
          index: 544
        }
      },
      {
        bits6: {
          part: 0,
          index: 555
        }
      },
      {
        bits6: {
          part: 0,
          index: 567
        }
      },
      {
        bits6: {
          part: 0,
          index: 617
        }
      },
      {
        bits6: {
          part: 0,
          index: 629
        }
      },
      {
        bits6: {
          part: 0,
          index: 640
        }
      },
      {
        bits6: {
          part: 0,
          index: 651
        }
      },
      {
        bits6: {
          part: 0,
          index: 663
        }
      },
      {
        bits6: {
          part: 0,
          index: 674
        }
      },
      {
        bits6: {
          part: 0,
          index: 686
        }
      },
      {
        bits6: {
          part: 0,
          index: 697
        }
      },
      {
        bits6: {
          part: 0,
          index: 709
        }
      },
      {
        bits6: {
          part: 0,
          index: 759
        }
      },
      {
        bits6: {
          part: 0,
          index: 770
        }
      },
      {
        bits6: {
          part: 0,
          index: 782
        }
      },
      {
        bits6: {
          part: 0,
          index: 793
        }
      },
      {
        bits6: {
          part: 0,
          index: 805
        }
      },
      {
        bits6: {
          part: 0,
          index: 816
        }
      },
      {
        bits6: {
          part: 0,
          index: 827
        }
      },
      {
        bits6: {
          part: 0,
          index: 839
        }
      },
      {
        bits6: {
          part: 0,
          index: 850
        }
      },
      {
        bits6: {
          part: 0,
          index: 928
        }
      },
      {
        bits6: {
          part: 0,
          index: 939
        }
      },
      {
        bits6: {
          part: 0,
          index: 951
        }
      },
      {
        bits6: {
          part: 0,
          index: 962
        }
      },
      {
        bits6: {
          part: 0,
          index: 974
        }
      },
      {
        bits6: {
          part: 0,
          index: 985
        }
      },
      {
        bits6: {
          part: 0,
          index: 997
        }
      },
      {
        bits6: {
          part: 0,
          index: 1008
        }
      },
      {
        bits6: {
          part: 1,
          index: 19
        }
      },
      {
        bits6: {
          part: 1,
          index: 97
        }
      },
      {
        bits6: {
          part: 1,
          index: 109
        }
      },
      {
        bits6: {
          part: 1,
          index: 120
        }
      },
      {
        bits6: {
          part: 1,
          index: 131
        }
      },
      {
        bits6: {
          part: 1,
          index: 143
        }
      },
      {
        bits6: {
          part: 1,
          index: 154
        }
      },
      {
        bits6: {
          part: 1,
          index: 166
        }
      },
      {
        bits6: {
          part: 1,
          index: 177
        }
      },
      {
        bits6: {
          part: 1,
          index: 189
        }
      },
      {
        bits6: {
          part: 1,
          index: 266
        }
      },
      {
        bits6: {
          part: 1,
          index: 278
        }
      },
      {
        bits6: {
          part: 1,
          index: 289
        }
      },
      {
        bits6: {
          part: 1,
          index: 301
        }
      },
      {
        bits6: {
          part: 1,
          index: 312
        }
      },
      {
        bits6: {
          part: 1,
          index: 323
        }
      },
      {
        bits6: {
          part: 1,
          index: 335
        }
      },
      {
        bits6: {
          part: 1,
          index: 346
        }
      },
      {
        bits6: {
          part: 1,
          index: 358
        }
      },
      {
        bits6: {
          part: 1,
          index: 435
        }
      },
      {
        bits6: {
          part: 1,
          index: 447
        }
      },
      {
        bits6: {
          part: 1,
          index: 458
        }
      },
      {
        bits6: {
          part: 1,
          index: 470
        }
      },
      {
        bits6: {
          part: 1,
          index: 481
        }
      },
      {
        bits6: {
          part: 1,
          index: 493
        }
      },
      {
        bits6: {
          part: 1,
          index: 504
        }
      },
      {
        bits6: {
          part: 1,
          index: 515
        }
      },
      {
        bits6: {
          part: 1,
          index: 527
        }
      },
      {
        bits6: {
          part: 1,
          index: 605
        }
      },
      {
        bits6: {
          part: 1,
          index: 616
        }
      },
      {
        bits6: {
          part: 1,
          index: 627
        }
      },
      {
        bits6: {
          part: 1,
          index: 639
        }
      },
      {
        bits6: {
          part: 1,
          index: 650
        }
      },
      {
        bits6: {
          part: 1,
          index: 662
        }
      },
      {
        bits6: {
          part: 1,
          index: 673
        }
      },
      {
        bits6: {
          part: 1,
          index: 685
        }
      },
      {
        bits6: {
          part: 1,
          index: 696
        }
      }
    ]
  },
  {
    name: 'EQ Shelving',
    type: 'enum',
    values: constants.EQ_SHELVING_SLOPES,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 194
        }
      },
      {
        bits6: {
          part: 0,
          index: 206
        }
      },
      {
        bits6: {
          part: 0,
          index: 217
        }
      },
      {
        bits6: {
          part: 0,
          index: 229
        }
      },
      {
        bits6: {
          part: 0,
          index: 240
        }
      },
      {
        bits6: {
          part: 0,
          index: 251
        }
      },
      {
        bits6: {
          part: 0,
          index: 263
        }
      },
      {
        bits6: {
          part: 0,
          index: 274
        }
      },
      {
        bits6: {
          part: 0,
          index: 286
        }
      },
      {
        bits6: {
          part: 0,
          index: 336
        }
      },
      {
        bits6: {
          part: 0,
          index: 347
        }
      },
      {
        bits6: {
          part: 0,
          index: 359
        }
      },
      {
        bits6: {
          part: 0,
          index: 370
        }
      },
      {
        bits6: {
          part: 0,
          index: 382
        }
      },
      {
        bits6: {
          part: 0,
          index: 393
        }
      },
      {
        bits6: {
          part: 0,
          index: 405
        }
      },
      {
        bits6: {
          part: 0,
          index: 416
        }
      },
      {
        bits6: {
          part: 0,
          index: 427
        }
      },
      {
        bits6: {
          part: 0,
          index: 478
        }
      },
      {
        bits6: {
          part: 0,
          index: 489
        }
      },
      {
        bits6: {
          part: 0,
          index: 501
        }
      },
      {
        bits6: {
          part: 0,
          index: 512
        }
      },
      {
        bits6: {
          part: 0,
          index: 523
        }
      },
      {
        bits6: {
          part: 0,
          index: 535
        }
      },
      {
        bits6: {
          part: 0,
          index: 546
        }
      },
      {
        bits6: {
          part: 0,
          index: 558
        }
      },
      {
        bits6: {
          part: 0,
          index: 569
        }
      },
      {
        bits6: {
          part: 0,
          index: 619
        }
      },
      {
        bits6: {
          part: 0,
          index: 631
        }
      },
      {
        bits6: {
          part: 0,
          index: 642
        }
      },
      {
        bits6: {
          part: 0,
          index: 654
        }
      },
      {
        bits6: {
          part: 0,
          index: 665
        }
      },
      {
        bits6: {
          part: 0,
          index: 677
        }
      },
      {
        bits6: {
          part: 0,
          index: 688
        }
      },
      {
        bits6: {
          part: 0,
          index: 699
        }
      },
      {
        bits6: {
          part: 0,
          index: 711
        }
      },
      {
        bits6: {
          part: 0,
          index: 761
        }
      },
      {
        bits6: {
          part: 0,
          index: 773
        }
      },
      {
        bits6: {
          part: 0,
          index: 784
        }
      },
      {
        bits6: {
          part: 0,
          index: 795
        }
      },
      {
        bits6: {
          part: 0,
          index: 807
        }
      },
      {
        bits6: {
          part: 0,
          index: 818
        }
      },
      {
        bits6: {
          part: 0,
          index: 830
        }
      },
      {
        bits6: {
          part: 0,
          index: 841
        }
      },
      {
        bits6: {
          part: 0,
          index: 853
        }
      },
      {
        bits6: {
          part: 0,
          index: 930
        }
      },
      {
        bits6: {
          part: 0,
          index: 942
        }
      },
      {
        bits6: {
          part: 0,
          index: 953
        }
      },
      {
        bits6: {
          part: 0,
          index: 965
        }
      },
      {
        bits6: {
          part: 0,
          index: 976
        }
      },
      {
        bits6: {
          part: 0,
          index: 987
        }
      },
      {
        bits6: {
          part: 0,
          index: 999
        }
      },
      {
        bits6: {
          part: 0,
          index: 1010
        }
      },
      {
        bits6: {
          part: 1,
          index: 22
        }
      },
      {
        bits6: {
          part: 1,
          index: 99
        }
      },
      {
        bits6: {
          part: 1,
          index: 111
        }
      },
      {
        bits6: {
          part: 1,
          index: 122
        }
      },
      {
        bits6: {
          part: 1,
          index: 134
        }
      },
      {
        bits6: {
          part: 1,
          index: 145
        }
      },
      {
        bits6: {
          part: 1,
          index: 157
        }
      },
      {
        bits6: {
          part: 1,
          index: 168
        }
      },
      {
        bits6: {
          part: 1,
          index: 179
        }
      },
      {
        bits6: {
          part: 1,
          index: 191
        }
      },
      {
        bits6: {
          part: 1,
          index: 269
        }
      },
      {
        bits6: {
          part: 1,
          index: 280
        }
      },
      {
        bits6: {
          part: 1,
          index: 291
        }
      },
      {
        bits6: {
          part: 1,
          index: 303
        }
      },
      {
        bits6: {
          part: 1,
          index: 314
        }
      },
      {
        bits6: {
          part: 1,
          index: 326
        }
      },
      {
        bits6: {
          part: 1,
          index: 337
        }
      },
      {
        bits6: {
          part: 1,
          index: 349
        }
      },
      {
        bits6: {
          part: 1,
          index: 360
        }
      },
      {
        bits6: {
          part: 1,
          index: 438
        }
      },
      {
        bits6: {
          part: 1,
          index: 449
        }
      },
      {
        bits6: {
          part: 1,
          index: 461
        }
      },
      {
        bits6: {
          part: 1,
          index: 472
        }
      },
      {
        bits6: {
          part: 1,
          index: 483
        }
      },
      {
        bits6: {
          part: 1,
          index: 495
        }
      },
      {
        bits6: {
          part: 1,
          index: 506
        }
      },
      {
        bits6: {
          part: 1,
          index: 518
        }
      },
      {
        bits6: {
          part: 1,
          index: 529
        }
      },
      {
        bits6: {
          part: 1,
          index: 607
        }
      },
      {
        bits6: {
          part: 1,
          index: 618
        }
      },
      {
        bits6: {
          part: 1,
          index: 630
        }
      },
      {
        bits6: {
          part: 1,
          index: 641
        }
      },
      {
        bits6: {
          part: 1,
          index: 653
        }
      },
      {
        bits6: {
          part: 1,
          index: 664
        }
      },
      {
        bits6: {
          part: 1,
          index: 675
        }
      },
      {
        bits6: {
          part: 1,
          index: 687
        }
      },
      {
        bits6: {
          part: 1,
          index: 698
        }
      }
    ]
  }
];

const outputCommands = [
  {
    name: 'Channel Name',
    type: 'enum',
    values: constants.OUTPUT_NAMES,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 855
        }
      },
      {
        bits6: {
          part: 1,
          index: 24
        }
      },
      {
        bits6: {
          part: 1,
          index: 193
        }
      },
      {
        bits6: {
          part: 1,
          index: 362
        }
      },
      {
        bits6: {
          part: 1,
          index: 531
        }
      },
      {
        bits6: {
          part: 1,
          index: 701
        }
      }
    ]
  },
  {
    name: 'Source',
    type: 'enum',
    values: constants.OUTPUT_SOURCES,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 857
        }
      },
      {
        bits6: {
          part: 1,
          index: 26
        }
      },
      {
        bits6: {
          part: 1,
          index: 195
        }
      },
      {
        bits6: {
          part: 1,
          index: 365
        }
      },
      {
        bits6: {
          part: 1,
          index: 534
        }
      },
      {
        bits6: {
          part: 1,
          index: 703
        }
      }
    ]
  },
  {
    name: 'Highpass Filter',
    type: 'enum',
    values: constants.CROSSOVER_FILTERS,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 859
        }
      },
      {
        bits6: {
          part: 1,
          index: 29
        }
      },
      {
        bits6: {
          part: 1,
          index: 198
        }
      },
      {
        bits6: {
          part: 1,
          index: 367
        }
      },
      {
        bits6: {
          part: 1,
          index: 536
        }
      },
      {
        bits6: {
          part: 1,
          index: 705
        }
      }
    ]
  },
  {
    name: 'Highpass Frequency',
    type: 'enum',
    unit: 'Hz',
    values: constants.LOG_FREQUENCY_SCALE,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 862
        },
        bit7: {
          part: 0,
          index: 868,
          bit: 1
        },
        bits8: {
          part: 0,
          index: 863
        }
      },
      {
        bits6: {
          part: 1,
          index: 31
        },
        bit7: {
          part: 1,
          index: 36,
          bit: 2
        },
        bits8: {
          part: 1,
          index: 32
        }
      },
      {
        bits6: {
          part: 1,
          index: 200
        },
        bit7: {
          part: 1,
          index: 204,
          bit: 3
        },
        bits8: {
          part: 1,
          index: 201
        }
      },
      {
        bits6: {
          part: 1,
          index: 369
        },
        bit7: {
          part: 1,
          index: 372,
          bit: 4
        },
        bits8: {
          part: 1,
          index: 370
        }
      },
      {
        bits6: {
          part: 1,
          index: 538
        },
        bit7: {
          part: 1,
          index: 540,
          bit: 5
        },
        bits8: {
          part: 1,
          index: 539
        }
      },
      {
        bits6: {
          part: 1,
          index: 707
        },
        bit7: {
          part: 1,
          index: 708,
          bit: 6
        },
        bits8: {
          part: 1,
          index: 709
        }
      }
    ]
  },
  {
    name: 'Lowpass Filter',
    type: 'enum',
    values: constants.CROSSOVER_FILTERS,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 864
        }
      },
      {
        bits6: {
          part: 1,
          index: 33
        }
      },
      {
        bits6: {
          part: 1,
          index: 202
        }
      },
      {
        bits6: {
          part: 1,
          index: 371
        }
      },
      {
        bits6: {
          part: 1,
          index: 541
        }
      },
      {
        bits6: {
          part: 1,
          index: 710
        }
      }
    ]
  },
  {
    name: 'Lowpass Frequency',
    type: 'enum',
    unit: 'Hz',
    values: constants.LOG_FREQUENCY_SCALE,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 866
        },
        bit7: {
          part: 0,
          index: 868,
          bit: 5
        },
        bits8: {
          part: 0,
          index: 867
        }
      },
      {
        bits6: {
          part: 1,
          index: 35
        },
        bit7: {
          part: 1,
          index: 36,
          bit: 6
        },
        bits8: {
          part: 1,
          index: 37
        }
      },
      {
        bits6: {
          part: 1,
          index: 205
        },
        bit7: {
          part: 1,
          index: 212,
          bit: 0
        },
        bits8: {
          part: 1,
          index: 206
        }
      },
      {
        bits6: {
          part: 1,
          index: 374
        },
        bit7: {
          part: 1,
          index: 380,
          bit: 1
        },
        bits8: {
          part: 1,
          index: 375
        }
      },
      {
        bits6: {
          part: 1,
          index: 543
        },
        bit7: {
          part: 1,
          index: 548,
          bit: 2
        },
        bits8: {
          part: 1,
          index: 544
        }
      },
      {
        bits6: {
          part: 1,
          index: 712
        },
        bit7: {
          part: 1,
          index: 716,
          bit: 3
        },
        bits8: {
          part: 1,
          index: 713
        }
      }
    ]
  },
  {
    name: 'Is Limiter On',
    type: 'bool',
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 869
        }
      },
      {
        bits6: {
          part: 1,
          index: 38
        }
      },
      {
        bits6: {
          part: 1,
          index: 207
        }
      },
      {
        bits6: {
          part: 1,
          index: 376
        }
      },
      {
        bits6: {
          part: 1,
          index: 545
        }
      },
      {
        bits6: {
          part: 1,
          index: 714
        }
      }
    ]
  },
  {
    name: 'Limiter Threshold',
    type: 'number',
    unit: 'dB',
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 871
        },
        bit7: {
          part: 0,
          index: 876,
          bit: 2
        }
      },
      {
        bits6: {
          part: 1,
          index: 40
        },
        bit7: {
          part: 1,
          index: 44,
          bit: 3
        }
      },
      {
        bits6: {
          part: 1,
          index: 209
        },
        bit7: {
          part: 1,
          index: 212,
          bit: 4
        }
      },
      {
        bits6: {
          part: 1,
          index: 378
        },
        bit7: {
          part: 1,
          index: 380,
          bit: 5
        }
      },
      {
        bits6: {
          part: 1,
          index: 547
        },
        bit7: {
          part: 1,
          index: 548,
          bit: 6
        }
      },
      {
        bits6: {
          part: 1,
          index: 717
        },
        bit7: {
          part: 1,
          index: 724,
          bit: 0
        }
      }
    ],
    min: -24,
    max: 0,
    step: 0.1
  },
  {
    name: 'Limiter Release',
    type: 'enum',
    unit: 'ms',
    values: constants.LOG_ZERO_TO_4000_MS,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 873
        },
        bit7: {
          part: 0,
          index: 876,
          bit: 4
        }
      },
      {
        bits6: {
          part: 1,
          index: 42
        },
        bit7: {
          part: 1,
          index: 44,
          bit: 5
        }
      },
      {
        bits6: {
          part: 1,
          index: 211
        },
        bit7: {
          part: 1,
          index: 212,
          bit: 6
        }
      },
      {
        bits6: {
          part: 1,
          index: 381
        },
        bit7: {
          part: 1,
          index: 388,
          bit: 0
        }
      },
      {
        bits6: {
          part: 1,
          index: 550
        },
        bit7: {
          part: 1,
          index: 556,
          bit: 1
        }
      },
      {
        bits6: {
          part: 1,
          index: 719
        },
        bit7: {
          part: 1,
          index: 724,
          bit: 2
        }
      }
    ]
  },
  {
    name: 'Polarity',
    type: 'enum',
    values: constants.POLARITIES,
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 875
        }
      },
      {
        bits6: {
          part: 1,
          index: 45
        }
      },
      {
        bits6: {
          part: 1,
          index: 214
        }
      },
      {
        bits6: {
          part: 1,
          index: 383
        }
      },
      {
        bits6: {
          part: 1,
          index: 552
        }
      },
      {
        bits6: {
          part: 1,
          index: 721
        }
      }
    ]
  },
  {
    name: 'Phase',
    type: 'number',
    unit: '°',
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 878
        }
      },
      {
        bits6: {
          part: 1,
          index: 47
        }
      },
      {
        bits6: {
          part: 1,
          index: 216
        }
      },
      {
        bits6: {
          part: 1,
          index: 385
        }
      },
      {
        bits6: {
          part: 1,
          index: 554
        }
      },
      {
        bits6: {
          part: 1,
          index: 723
        }
      }
    ],
    min: 0,
    max: 180,
    step: 5
  },
  {
    name: 'Short Delay',
    type: 'number',
    unit: 'mm',
    syncResponses: [
      {
        bits6: {
          part: 0,
          index: 880
        },
        bit7: {
          part: 0,
          index: 884,
          bit: 3
        },
        bits8: {
          part: 0,
          index: 881
        }
      },
      {
        bits6: {
          part: 1,
          index: 49
        },
        bit7: {
          part: 1,
          index: 52,
          bit: 4
        },
        bits8: {
          part: 1,
          index: 50
        }
      },
      {
        bits6: {
          part: 1,
          index: 218
        },
        bit7: {
          part: 1,
          index: 220,
          bit: 5
        },
        bits8: {
          part: 1,
          index: 219
        }
      },
      {
        bits6: {
          part: 1,
          index: 387
        },
        bit7: {
          part: 1,
          index: 388,
          bit: 6
        },
        bits8: {
          part: 1,
          index: 389
        }
      },
      {
        bits6: {
          part: 1,
          index: 557
        },
        bit7: {
          part: 1,
          index: 564,
          bit: 0
        },
        bits8: {
          part: 1,
          index: 558
        }
      },
      {
        bits6: {
          part: 1,
          index: 726
        },
        bit7: {
          part: 1,
          index: 732,
          bit: 1
        },
        bits8: {
          part: 1,
          index: 727
        }
      }
    ],
    min: 0,
    max: 4000,
    step: 2
  }
];

module.exports = {
  setupCommands,
  inputOutputCommands,
  eqCommands,
  outputCommands
};
