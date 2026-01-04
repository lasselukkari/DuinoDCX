// Auto-generated 8-bit parameter mappings
// Indices are absolute positions in combined decoded buffer (part0 + part1)

export type ParameterInfo = {
  name: string;
  type: "bool" | "enum" | "number";
  index: number;
  highByteIndex?: number;
  bit7?: { index: number; bit: number };
  values?: readonly string[];
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
};

export const setupParameters: ParameterInfo[] = [
  {
    name: "Input Sum Type",
    type: "enum",
    index: 109,
    values: ["Off","A","B","C","A+B","A+C","B+C"],
  },
  {
    name: "Input AB Source",
    type: "enum",
    index: 111,
    values: ["Analog","AES/EBU"],
  },
  {
    name: "Input C Gain",
    type: "enum",
    index: 113,
    values: ["Line","Mic"],
  },
  {
    name: "Output Config",
    type: "enum",
    index: 115,
    values: ["mono","lmhlmh","llmmhh","lhlhlh"],
  },
  {
    name: "Stereolink",
    type: "bool",
    index: 118,
  },
  {
    name: "Stereolink Mode",
    type: "enum",
    index: 120,
    values: ["Off","A+B","A+B+C","A+B+C+Sum"],
  },
  {
    name: "Delay Link",
    type: "bool",
    index: 122,
  },
  {
    name: "Crossover Link",
    type: "bool",
    index: 125,
  },
  {
    name: "Is Delay Correction On",
    type: "bool",
    index: 127,
  },
  {
    name: "Air Temperature",
    type: "number",
    index: 129,
    unit: "°C",
    min: -20,
    max: 50,
    step: 1,
  },
  {
    name: "Delay Units",
    type: "enum",
    index: 47,
    values: ["mm","inch"],
  },
  {
    name: "Mute Outs When Powered",
    type: "bool",
    index: 49,
  },
  {
    name: "Input A Sum Gain",
    type: "number",
    index: 131,
    highByteIndex: 133,
    bit7: {"index":132,"bit":6},
    unit: "dB",
    min: -15,
    max: 15,
    step: 0.1,
  },
  {
    name: "Input B Sum Gain",
    type: "number",
    index: 134,
    highByteIndex: 135,
    bit7: {"index":140,"bit":1},
    unit: "dB",
    min: -15,
    max: 15,
    step: 0.1,
  },
  {
    name: "Input C Sum Gain",
    type: "number",
    index: 136,
    highByteIndex: 137,
    bit7: {"index":140,"bit":3},
    unit: "dB",
    min: -15,
    max: 15,
    step: 0.1,
  },
];

// Channel indices: 0=A, 1=B, 2=C, 3=Sum, 4=Out1, 5=Out2, 6=Out3, 7=Out4, 8=Out5, 9=Out6
export const channelParameters: Array<{
  name: string;
  type: "bool" | "enum" | "number";
  channels: Array<{ index: number; highByteIndex?: number; bit7?: { index: number; bit: number } } | null>;
  values?: readonly string[];
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}> = [
  {
    name: "Gain",
    type: "number",
    channels: [{"index":138,"highByteIndex":139,"bit7":{"index":140,"bit":5}},{"index":280,"highByteIndex":281,"bit7":{"index":284,"bit":3}},{"index":422,"highByteIndex":423,"bit7":{"index":428,"bit":1}},{"index":563,"highByteIndex":565,"bit7":{"index":564,"bit":6}},{"index":705,"highByteIndex":706,"bit7":{"index":708,"bit":4}},{"index":874,"highByteIndex":875,"bit7":{"index":876,"bit":5}},{"index":1049,"highByteIndex":1051,"bit7":{"index":1050,"bit":6}},{"index":1219,"highByteIndex":1220,"bit7":{"index":1226,"bit":0}},{"index":1388,"highByteIndex":1389,"bit7":{"index":1394,"bit":1}},{"index":1557,"highByteIndex":1558,"bit7":{"index":1562,"bit":2}}],
    unit: "dB",
    min: -15,
    max: 15,
    step: 0.1,
  },
  {
    name: "Mute",
    type: "bool",
    channels: [{"index":141},{"index":282},{"index":424},{"index":566},{"index":707},{"index":877},{"index":1052},{"index":1221},{"index":1390},{"index":1559}],
  },
  {
    name: "Is Delay On",
    type: "bool",
    channels: [{"index":143},{"index":285},{"index":426},{"index":568},{"index":710},{"index":879},{"index":1054},{"index":1223},{"index":1392},{"index":1561}],
  },
  {
    name: "Long Delay",
    type: "number",
    channels: [{"index":145,"highByteIndex":146,"bit7":{"index":148,"bit":4}},{"index":287,"highByteIndex":288,"bit7":{"index":292,"bit":2}},{"index":429,"highByteIndex":430,"bit7":{"index":436,"bit":0}},{"index":570,"highByteIndex":571,"bit7":{"index":572,"bit":5}},{"index":712,"highByteIndex":713,"bit7":{"index":716,"bit":3}},{"index":881,"highByteIndex":882,"bit7":{"index":884,"bit":4}},{"index":1056,"highByteIndex":1057,"bit7":{"index":1058,"bit":5}},{"index":1225,"highByteIndex":1227,"bit7":{"index":1226,"bit":6}},{"index":1395,"highByteIndex":1396,"bit7":{"index":1402,"bit":0}},{"index":1564,"highByteIndex":1565,"bit7":{"index":1570,"bit":1}}],
    unit: "cm",
    min: 0,
    max: 20000,
    step: 5,
  },
  {
    name: "Is EQ On",
    type: "bool",
    channels: [{"index":147},{"index":289},{"index":431},{"index":573},{"index":714},{"index":883},{"index":1059},{"index":1228},{"index":1397},{"index":1566}],
  },
  {
    name: "EQ Number",
    type: "number",
    channels: [{"index":150},{"index":291},{"index":433},{"index":575},{"index":717},{"index":886},{"index":1061},{"index":1230},{"index":1399},{"index":1568}],
    min: 0,
    max: 9,
    step: 1,
  },
  {
    name: "EQ Index",
    type: "number",
    channels: [{"index":152},{"index":294},{"index":435},{"index":577},{"index":719},{"index":888},{"index":1063},{"index":1232},{"index":1401},{"index":1571}],
    min: 0,
    max: 9,
    step: 1,
  },
  {
    name: "Dynamic EQ Attack",
    type: "enum",
    channels: [{"index":154},{"index":296},{"index":438},{"index":579},{"index":721},{"index":890},{"index":1065},{"index":1235},{"index":1404},{"index":1573}],
    values: ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36","37","38","39","40","41","42","43","44","45","46","47","48","49","50","51","52","53","54","55","56","57","58","59","60","61","62","63","64","65","66","67","68","69","70","71","72","74","76","78","81","83","85","87","90","92","95","97","100","103","105","108","111","114","117","120","124","127","131","134","138","141","145","149","153","157","162","166","170","175","180","185","190","195","200"],
    unit: "ms",
  },
  {
    name: "Dynamic EQ Release",
    type: "enum",
    channels: [{"index":157,"bit7":{"index":164,"bit":0}},{"index":298,"bit7":{"index":300,"bit":5}},{"index":440,"bit7":{"index":444,"bit":3}},{"index":582,"bit7":{"index":588,"bit":1}},{"index":723,"bit7":{"index":724,"bit":6}},{"index":893,"bit7":{"index":900,"bit":0}},{"index":1068,"bit7":{"index":1074,"bit":1}},{"index":1237,"bit7":{"index":1242,"bit":2}},{"index":1406,"bit7":{"index":1410,"bit":3}},{"index":1575,"bit7":{"index":1578,"bit":4}}],
    values: ["20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36","37","38","39","40","41","42","43","44","45","46","47","48","49","50","51","52","53","54","55","56","57","58","59","60","61","62","63","64","65","66","67","68","69","70","71","72","73","74","75","76","77","78","79","80","81","82","83","84","85","86","87","89","91","93","95","97","99","101","103","105","108","110","112","115","117","119","122","124","127","130","132","135","138","141","144","147","150","153","156","160","163","167","170","174","177","181","185","189","193","197","201","205","209","214","218","223","227","232","237","242","247","252","258","263","269","274","280","286","292","298","304","311","317","324","331","337","345","352","359","367","374","382","390","399","407","415","424","433","442","451","461","471","480","491","501","511","522","533","544","556","567","579","591","604","616","629","643","656","670","684","698","713","728","743","759","775","791","808","825","842","860","878","896","915","934","954","974","994","1015","1036","1058","1080","1103","1126","1150","1174","1199","1224","1249","1276","1303","1330","1358","1386","1415","1445","1475","1506","1538","1570","1603","1637","1671","1706","1742","1779","1816","1854","1893","1933","1974","2015","2057","2101","2145","2190","2236","2283","2330","2379","2429","2480","2532","2586","2640","2695","2752","2810","2869","2929","2990","3053","3117","3183","3250","3318","3387","3459","3531","3605","3681","3758","3837","3918","4000"],
    unit: "ms",
  },
  {
    name: "Dynamic EQ Ratio",
    type: "enum",
    channels: [{"index":159},{"index":301},{"index":442},{"index":584},{"index":726},{"index":895},{"index":1070},{"index":1239},{"index":1408},{"index":1577}],
    values: ["1.1:1","1.2:1","1.4:1","1.6:1","1.8:1","2.0:1","2.5:1","3.0:1","3.5:1","4.0:1","5.0:1","6.0:1","8.0:1","10.0:1","20.0:1","inf:1"],
  },
  {
    name: "Dynamic EQ Threshold",
    type: "number",
    channels: [{"index":161,"highByteIndex":162,"bit7":{"index":164,"bit":4}},{"index":303,"highByteIndex":304,"bit7":{"index":308,"bit":2}},{"index":445,"highByteIndex":446,"bit7":{"index":452,"bit":0}},{"index":586,"highByteIndex":587,"bit7":{"index":588,"bit":5}},{"index":728,"highByteIndex":729,"bit7":{"index":732,"bit":3}},{"index":897,"highByteIndex":898,"bit7":{"index":900,"bit":4}},{"index":1072,"highByteIndex":1073,"bit7":{"index":1074,"bit":5}},{"index":1241,"highByteIndex":1243,"bit7":{"index":1242,"bit":6}},{"index":1411,"highByteIndex":1412,"bit7":{"index":1418,"bit":0}},{"index":1580,"highByteIndex":1581,"bit7":{"index":1586,"bit":1}}],
    unit: "dB",
    min: -60,
    max: 0,
    step: 0.1,
  },
  {
    name: "Is Dynamic EQ On",
    type: "bool",
    channels: [{"index":163},{"index":305},{"index":447},{"index":589},{"index":730},{"index":899},{"index":1075},{"index":1244},{"index":1413},{"index":1582}],
  },
  {
    name: "Dynamic EQ Frequency",
    type: "enum",
    channels: [{"index":166,"highByteIndex":167,"bit7":{"index":172,"bit":1}},{"index":307,"highByteIndex":309,"bit7":{"index":308,"bit":6}},{"index":449,"highByteIndex":450,"bit7":{"index":452,"bit":4}},{"index":591,"highByteIndex":592,"bit7":{"index":596,"bit":2}},{"index":733,"highByteIndex":734,"bit7":{"index":740,"bit":0}},{"index":902,"highByteIndex":903,"bit7":{"index":908,"bit":1}},{"index":1077,"highByteIndex":1078,"bit7":{"index":1082,"bit":2}},{"index":1246,"highByteIndex":1247,"bit7":{"index":1250,"bit":3}},{"index":1415,"highByteIndex":1416,"bit7":{"index":1418,"bit":4}},{"index":1584,"highByteIndex":1585,"bit7":{"index":1586,"bit":5}}],
    values: ["20","20.5","21","21.5","22","22.5","23","23.5","24","24.5","25","25.5","26","27","27.5","28","28.5","29","30","30.5","31","32","32.5","33","34","34.5","35","36","37","38","38.5","39","40","41","42","43","44","45","46","47","48","49","50","51","52","53","54","56","57","58","59","61","62","63","65","66","68","69","71","72","74","75","77","79","80","82","84","86","88","90","92","94","96","98","100","102","104","107","109","111","114","116","119","121","124","127","130","132","135","138","141","145","148","151","154","158","161","165","168","172","176","180","184","188","192","196","200","205","209","214","218","223","228","233","238","243","249","254","260","266","271","277","284","290","296","303","309","316","323","330","337","345","352","360","368","376","384","393","401","410","419","428","438","447","457","467","478","488","499","510","521","532","544","556","568","581","594","607","620","634","647","662","676","691","706","722","738","754","770","787","805","822","840","859","878","897","917","937","957","979","1000","1020","1040","1070","1090","1110","1140","1160","1190","1210","1240","1270","1290","1320","1350","1380","1410","1440","1470","1500","1530","1570","1600","1640","1670","1710","1740","1780","1820","1860","1900","1940","1980","2030","2070","2110","2160","2210","2250","2300","2350","2400","2460","2510","2560","2620","2680","2730","2790","2850","2920","2980","3040","3110","3180","3240","3310","3390","3460","3530","3610","3690","3770","3850","3930","4020","4110","4190","4280","4380","4470","4570","4670","4770","4870","4980","5080","5190","5310","5420","5540","5660","5780","5910","6030","6160","6300","6430","6570","6720","6860","7010","7160","7320","7470","7640","7800","7970","8140","8320","8500","8680","8870","9060","9260","9460","9660","9870","10100","10300","10500","10800","11000","11200","11500","11700","12000","12200","12500","12800","13000","13300","13600","13900","14200","14500","14800","15100","15500","15800","16100","16500","16900","17200","17600","18000","18400","18800","19200","19600","20000"],
    unit: "Hz",
  },
  {
    name: "Dynamic EQ Q",
    type: "enum",
    channels: [{"index":168},{"index":310},{"index":451},{"index":593},{"index":735},{"index":904},{"index":1079},{"index":1248},{"index":1417},{"index":1587}],
    values: ["0.1","0.125","0.15","0.175","0.2","0.225","0.25","0.275","0.3","0.33","0.36","0.4","0.43","0.46","0.5","0.6","0.65","0.7","0.8","0.9","1.0","1.1","1.3","1.4","1.6","1.8","2.0","2.2","2.5","2.8","3.2","3.5","4.0","4.5","5.0","5.6","6.3","7.1","7.9","8.9","10"],
  },
  {
    name: "Dynamic EQ Gain",
    type: "number",
    channels: [{"index":170,"highByteIndex":171,"bit7":{"index":172,"bit":5}},{"index":312,"highByteIndex":313,"bit7":{"index":316,"bit":3}},{"index":454,"highByteIndex":455,"bit7":{"index":460,"bit":1}},{"index":595,"highByteIndex":597,"bit7":{"index":596,"bit":6}},{"index":737,"highByteIndex":738,"bit7":{"index":740,"bit":4}},{"index":906,"highByteIndex":907,"bit7":{"index":908,"bit":5}},{"index":1081,"highByteIndex":1083,"bit7":{"index":1082,"bit":6}},{"index":1251,"highByteIndex":1252,"bit7":{"index":1258,"bit":0}},{"index":1420,"highByteIndex":1421,"bit7":{"index":1426,"bit":1}},{"index":1589,"highByteIndex":1590,"bit7":{"index":1594,"bit":2}}],
    unit: "dB",
    min: -15,
    max: 15,
    step: 0.1,
  },
  {
    name: "Dynamic EQ Type",
    type: "enum",
    channels: [{"index":173},{"index":314},{"index":456},{"index":598},{"index":739},{"index":909},{"index":1084},{"index":1253},{"index":1422},{"index":1591}],
    values: ["Low Shelv","Bandpass","High Shelv"],
  },
  {
    name: "Dynamic EQ Shelving",
    type: "enum",
    channels: [{"index":175},{"index":317},{"index":458},{"index":600},{"index":742},{"index":911},{"index":1086},{"index":1255},{"index":1424},{"index":1593}],
    values: ["6dB","12dB"],
  },
];

// Output-only parameters (indices 0-5 = outputs 1-6)
export const outputOnlyParameters: Array<{
  name: string;
  type: "bool" | "enum" | "number";
  outputs: Array<{ index: number; highByteIndex?: number; bit7?: { index: number; bit: number } } | null>;
  values?: readonly string[];
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}> = [
  {
    name: "Channel Name",
    type: "enum",
    outputs: [{"index":847},{"index":1022},{"index":1191},{"index":1360},{"index":1529},{"index":1699}],
    values: ["Full-range","Subwoofer","Low","Low-mid","Mid","Hi-mid","Hi","Left Full-range","Left Subwoofer","Left Low","Left Low-mid","Left Mid","Left Hi-mid","Left Hi","Right Full-range","Right Subwoofer","Right Low","Right Low-mid","Right Mid","Right Hi-mid","Right Hi","Center Full-range","Center Subwoofer","Center Low","Center Low-mid","Center Mid","Center Hi-mid","Center Hi"],
  },
  {
    name: "Source",
    type: "enum",
    outputs: [{"index":849},{"index":1024},{"index":1193},{"index":1363},{"index":1532},{"index":1701}],
    values: ["A","B","C","Sum"],
  },
  {
    name: "Highpass Filter",
    type: "enum",
    outputs: [{"index":851},{"index":1027},{"index":1196},{"index":1365},{"index":1534},{"index":1703}],
    values: ["off","but6","but12","bes12","lr12","but18","but24","bes24","lr24","but48","lr48"],
  },
  {
    name: "Highpass Frequency",
    type: "enum",
    outputs: [{"index":854,"highByteIndex":855,"bit7":{"index":860,"bit":1}},{"index":1029,"highByteIndex":1030,"bit7":{"index":1034,"bit":2}},{"index":1198,"highByteIndex":1199,"bit7":{"index":1202,"bit":3}},{"index":1367,"highByteIndex":1368,"bit7":{"index":1370,"bit":4}},{"index":1536,"highByteIndex":1537,"bit7":{"index":1538,"bit":5}},{"index":1705,"highByteIndex":1707,"bit7":{"index":1706,"bit":6}}],
    values: ["20","20.5","21","21.5","22","22.5","23","23.5","24","24.5","25","25.5","26","27","27.5","28","28.5","29","30","30.5","31","32","32.5","33","34","34.5","35","36","37","38","38.5","39","40","41","42","43","44","45","46","47","48","49","50","51","52","53","54","56","57","58","59","61","62","63","65","66","68","69","71","72","74","75","77","79","80","82","84","86","88","90","92","94","96","98","100","102","104","107","109","111","114","116","119","121","124","127","130","132","135","138","141","145","148","151","154","158","161","165","168","172","176","180","184","188","192","196","200","205","209","214","218","223","228","233","238","243","249","254","260","266","271","277","284","290","296","303","309","316","323","330","337","345","352","360","368","376","384","393","401","410","419","428","438","447","457","467","478","488","499","510","521","532","544","556","568","581","594","607","620","634","647","662","676","691","706","722","738","754","770","787","805","822","840","859","878","897","917","937","957","979","1000","1020","1040","1070","1090","1110","1140","1160","1190","1210","1240","1270","1290","1320","1350","1380","1410","1440","1470","1500","1530","1570","1600","1640","1670","1710","1740","1780","1820","1860","1900","1940","1980","2030","2070","2110","2160","2210","2250","2300","2350","2400","2460","2510","2560","2620","2680","2730","2790","2850","2920","2980","3040","3110","3180","3240","3310","3390","3460","3530","3610","3690","3770","3850","3930","4020","4110","4190","4280","4380","4470","4570","4670","4770","4870","4980","5080","5190","5310","5420","5540","5660","5780","5910","6030","6160","6300","6430","6570","6720","6860","7010","7160","7320","7470","7640","7800","7970","8140","8320","8500","8680","8870","9060","9260","9460","9660","9870","10100","10300","10500","10800","11000","11200","11500","11700","12000","12200","12500","12800","13000","13300","13600","13900","14200","14500","14800","15100","15500","15800","16100","16500","16900","17200","17600","18000","18400","18800","19200","19600","20000"],
    unit: "Hz",
  },
  {
    name: "Lowpass Filter",
    type: "enum",
    outputs: [{"index":856},{"index":1031},{"index":1200},{"index":1369},{"index":1539},{"index":1708}],
    values: ["off","but6","but12","bes12","lr12","but18","but24","bes24","lr24","but48","lr48"],
  },
  {
    name: "Lowpass Frequency",
    type: "enum",
    outputs: [{"index":858,"highByteIndex":859,"bit7":{"index":860,"bit":5}},{"index":1033,"highByteIndex":1035,"bit7":{"index":1034,"bit":6}},{"index":1203,"highByteIndex":1204,"bit7":{"index":1210,"bit":0}},{"index":1372,"highByteIndex":1373,"bit7":{"index":1378,"bit":1}},{"index":1541,"highByteIndex":1542,"bit7":{"index":1546,"bit":2}},{"index":1710,"highByteIndex":1711,"bit7":{"index":1714,"bit":3}}],
    values: ["20","20.5","21","21.5","22","22.5","23","23.5","24","24.5","25","25.5","26","27","27.5","28","28.5","29","30","30.5","31","32","32.5","33","34","34.5","35","36","37","38","38.5","39","40","41","42","43","44","45","46","47","48","49","50","51","52","53","54","56","57","58","59","61","62","63","65","66","68","69","71","72","74","75","77","79","80","82","84","86","88","90","92","94","96","98","100","102","104","107","109","111","114","116","119","121","124","127","130","132","135","138","141","145","148","151","154","158","161","165","168","172","176","180","184","188","192","196","200","205","209","214","218","223","228","233","238","243","249","254","260","266","271","277","284","290","296","303","309","316","323","330","337","345","352","360","368","376","384","393","401","410","419","428","438","447","457","467","478","488","499","510","521","532","544","556","568","581","594","607","620","634","647","662","676","691","706","722","738","754","770","787","805","822","840","859","878","897","917","937","957","979","1000","1020","1040","1070","1090","1110","1140","1160","1190","1210","1240","1270","1290","1320","1350","1380","1410","1440","1470","1500","1530","1570","1600","1640","1670","1710","1740","1780","1820","1860","1900","1940","1980","2030","2070","2110","2160","2210","2250","2300","2350","2400","2460","2510","2560","2620","2680","2730","2790","2850","2920","2980","3040","3110","3180","3240","3310","3390","3460","3530","3610","3690","3770","3850","3930","4020","4110","4190","4280","4380","4470","4570","4670","4770","4870","4980","5080","5190","5310","5420","5540","5660","5780","5910","6030","6160","6300","6430","6570","6720","6860","7010","7160","7320","7470","7640","7800","7970","8140","8320","8500","8680","8870","9060","9260","9460","9660","9870","10100","10300","10500","10800","11000","11200","11500","11700","12000","12200","12500","12800","13000","13300","13600","13900","14200","14500","14800","15100","15500","15800","16100","16500","16900","17200","17600","18000","18400","18800","19200","19600","20000"],
    unit: "Hz",
  },
  {
    name: "Is Limiter On",
    type: "bool",
    outputs: [{"index":861},{"index":1036},{"index":1205},{"index":1374},{"index":1543},{"index":1712}],
  },
  {
    name: "Limiter Threshold",
    type: "number",
    outputs: [{"index":863,"bit7":{"index":868,"bit":2}},{"index":1038,"bit7":{"index":1042,"bit":3}},{"index":1207,"bit7":{"index":1210,"bit":4}},{"index":1376,"bit7":{"index":1378,"bit":5}},{"index":1545,"bit7":{"index":1546,"bit":6}},{"index":1715,"bit7":{"index":1722,"bit":0}}],
    unit: "dB",
    min: -24,
    max: 0,
    step: 0.1,
  },
  {
    name: "Limiter Release",
    type: "enum",
    outputs: [{"index":865,"bit7":{"index":868,"bit":4}},{"index":1040,"bit7":{"index":1042,"bit":5}},{"index":1209,"bit7":{"index":1210,"bit":6}},{"index":1379,"bit7":{"index":1386,"bit":0}},{"index":1548,"bit7":{"index":1554,"bit":1}},{"index":1717,"bit7":{"index":1722,"bit":2}}],
    values: ["20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36","37","38","39","40","41","42","43","44","45","46","47","48","49","50","51","52","53","54","55","56","57","58","59","60","61","62","63","64","65","66","67","68","69","70","71","72","73","74","75","76","77","78","79","80","81","82","83","84","85","86","87","89","91","93","95","97","99","101","103","105","108","110","112","115","117","119","122","124","127","130","132","135","138","141","144","147","150","153","156","160","163","167","170","174","177","181","185","189","193","197","201","205","209","214","218","223","227","232","237","242","247","252","258","263","269","274","280","286","292","298","304","311","317","324","331","337","345","352","359","367","374","382","390","399","407","415","424","433","442","451","461","471","480","491","501","511","522","533","544","556","567","579","591","604","616","629","643","656","670","684","698","713","728","743","759","775","791","808","825","842","860","878","896","915","934","954","974","994","1015","1036","1058","1080","1103","1126","1150","1174","1199","1224","1249","1276","1303","1330","1358","1386","1415","1445","1475","1506","1538","1570","1603","1637","1671","1706","1742","1779","1816","1854","1893","1933","1974","2015","2057","2101","2145","2190","2236","2283","2330","2379","2429","2480","2532","2586","2640","2695","2752","2810","2869","2929","2990","3053","3117","3183","3250","3318","3387","3459","3531","3605","3681","3758","3837","3918","4000"],
    unit: "ms",
  },
  {
    name: "Polarity",
    type: "enum",
    outputs: [{"index":867},{"index":1043},{"index":1212},{"index":1381},{"index":1550},{"index":1719}],
    values: ["Normal","Inverted"],
  },
  {
    name: "Phase",
    type: "number",
    outputs: [{"index":870},{"index":1045},{"index":1214},{"index":1383},{"index":1552},{"index":1721}],
    unit: "°",
    min: 0,
    max: 180,
    step: 5,
  },
  {
    name: "Short Delay",
    type: "number",
    outputs: [{"index":872,"highByteIndex":873,"bit7":{"index":876,"bit":3}},{"index":1047,"highByteIndex":1048,"bit7":{"index":1050,"bit":4}},{"index":1216,"highByteIndex":1217,"bit7":{"index":1218,"bit":5}},{"index":1385,"highByteIndex":1387,"bit7":{"index":1386,"bit":6}},{"index":1555,"highByteIndex":1556,"bit7":{"index":1562,"bit":0}},{"index":1724,"highByteIndex":1725,"bit7":{"index":1730,"bit":1}}],
    unit: "mm",
    min: 0,
    max: 4000,
    step: 2,
  },
];

// EQ parameters: 9 bands per channel, 10 channels
// Access as: eqParameters[paramIndex].bands[channelIndex * 9 + bandIndex]
export const eqParameters: Array<{
  name: string;
  type: "bool" | "enum" | "number";
  bands: Array<{ index: number; highByteIndex?: number; bit7?: { index: number; bit: number } } | null>;
  values?: readonly string[];
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}> = [
  {
    name: "EQ Frequency",
    type: "enum",
    bands: [{"index":177,"highByteIndex":178,"bit7":{"index":180,"bit":4}},{"index":189,"highByteIndex":190,"bit7":{"index":196,"bit":0}},{"index":200,"highByteIndex":201,"bit7":{"index":204,"bit":3}},{"index":211,"highByteIndex":213,"bit7":{"index":212,"bit":6}},{"index":223,"highByteIndex":224,"bit7":{"index":228,"bit":2}},{"index":234,"highByteIndex":235,"bit7":{"index":236,"bit":5}},{"index":246,"highByteIndex":247,"bit7":{"index":252,"bit":1}},{"index":257,"highByteIndex":258,"bit7":{"index":260,"bit":4}},{"index":269,"highByteIndex":270,"bit7":{"index":276,"bit":0}},{"index":319,"highByteIndex":320,"bit7":{"index":324,"bit":2}},{"index":330,"highByteIndex":331,"bit7":{"index":332,"bit":5}},{"index":342,"highByteIndex":343,"bit7":{"index":348,"bit":1}},{"index":353,"highByteIndex":354,"bit7":{"index":356,"bit":4}},{"index":365,"highByteIndex":366,"bit7":{"index":372,"bit":0}},{"index":376,"highByteIndex":377,"bit7":{"index":380,"bit":3}},{"index":387,"highByteIndex":389,"bit7":{"index":388,"bit":6}},{"index":399,"highByteIndex":400,"bit7":{"index":404,"bit":2}},{"index":410,"highByteIndex":411,"bit7":{"index":412,"bit":5}},{"index":461,"highByteIndex":462,"bit7":{"index":468,"bit":0}},{"index":472,"highByteIndex":473,"bit7":{"index":476,"bit":3}},{"index":483,"highByteIndex":485,"bit7":{"index":484,"bit":6}},{"index":495,"highByteIndex":496,"bit7":{"index":500,"bit":2}},{"index":506,"highByteIndex":507,"bit7":{"index":508,"bit":5}},{"index":518,"highByteIndex":519,"bit7":{"index":524,"bit":1}},{"index":529,"highByteIndex":530,"bit7":{"index":532,"bit":4}},{"index":541,"highByteIndex":542,"bit7":{"index":548,"bit":0}},{"index":552,"highByteIndex":553,"bit7":{"index":556,"bit":3}},{"index":602,"highByteIndex":603,"bit7":{"index":604,"bit":5}},{"index":614,"highByteIndex":615,"bit7":{"index":620,"bit":1}},{"index":625,"highByteIndex":626,"bit7":{"index":628,"bit":4}},{"index":637,"highByteIndex":638,"bit7":{"index":644,"bit":0}},{"index":648,"highByteIndex":649,"bit7":{"index":652,"bit":3}},{"index":659,"highByteIndex":661,"bit7":{"index":660,"bit":6}},{"index":671,"highByteIndex":672,"bit7":{"index":676,"bit":2}},{"index":682,"highByteIndex":683,"bit7":{"index":684,"bit":5}},{"index":694,"highByteIndex":695,"bit7":{"index":700,"bit":1}},{"index":744,"highByteIndex":745,"bit7":{"index":748,"bit":3}},{"index":755,"highByteIndex":757,"bit7":{"index":756,"bit":6}},{"index":767,"highByteIndex":768,"bit7":{"index":772,"bit":2}},{"index":778,"highByteIndex":779,"bit7":{"index":780,"bit":5}},{"index":790,"highByteIndex":791,"bit7":{"index":796,"bit":1}},{"index":801,"highByteIndex":802,"bit7":{"index":804,"bit":4}},{"index":813,"highByteIndex":814,"bit7":{"index":820,"bit":0}},{"index":824,"highByteIndex":825,"bit7":{"index":828,"bit":3}},{"index":835,"highByteIndex":837,"bit7":{"index":836,"bit":6}},{"index":913,"highByteIndex":914,"bit7":{"index":916,"bit":4}},{"index":925,"highByteIndex":926,"bit7":{"index":932,"bit":0}},{"index":936,"highByteIndex":937,"bit7":{"index":940,"bit":3}},{"index":947,"highByteIndex":949,"bit7":{"index":948,"bit":6}},{"index":959,"highByteIndex":960,"bit7":{"index":964,"bit":2}},{"index":970,"highByteIndex":971,"bit7":{"index":972,"bit":5}},{"index":982,"highByteIndex":983,"bit7":{"index":988,"bit":1}},{"index":993,"highByteIndex":994,"bit7":{"index":996,"bit":4}},{"index":1011,"highByteIndex":1012,"bit7":{"index":1018,"bit":0}},{"index":1088,"highByteIndex":1089,"bit7":{"index":1090,"bit":5}},{"index":1100,"highByteIndex":1101,"bit7":{"index":1106,"bit":1}},{"index":1111,"highByteIndex":1112,"bit7":{"index":1114,"bit":4}},{"index":1123,"highByteIndex":1124,"bit7":{"index":1130,"bit":0}},{"index":1134,"highByteIndex":1135,"bit7":{"index":1138,"bit":3}},{"index":1145,"highByteIndex":1147,"bit7":{"index":1146,"bit":6}},{"index":1157,"highByteIndex":1158,"bit7":{"index":1162,"bit":2}},{"index":1168,"highByteIndex":1169,"bit7":{"index":1170,"bit":5}},{"index":1180,"highByteIndex":1181,"bit7":{"index":1186,"bit":1}},{"index":1257,"highByteIndex":1259,"bit7":{"index":1258,"bit":6}},{"index":1269,"highByteIndex":1270,"bit7":{"index":1274,"bit":2}},{"index":1280,"highByteIndex":1281,"bit7":{"index":1282,"bit":5}},{"index":1292,"highByteIndex":1293,"bit7":{"index":1298,"bit":1}},{"index":1303,"highByteIndex":1304,"bit7":{"index":1306,"bit":4}},{"index":1315,"highByteIndex":1316,"bit7":{"index":1322,"bit":0}},{"index":1326,"highByteIndex":1327,"bit7":{"index":1330,"bit":3}},{"index":1337,"highByteIndex":1339,"bit7":{"index":1338,"bit":6}},{"index":1349,"highByteIndex":1350,"bit7":{"index":1354,"bit":2}},{"index":1427,"highByteIndex":1428,"bit7":{"index":1434,"bit":0}},{"index":1438,"highByteIndex":1439,"bit7":{"index":1442,"bit":3}},{"index":1449,"highByteIndex":1451,"bit7":{"index":1450,"bit":6}},{"index":1461,"highByteIndex":1462,"bit7":{"index":1466,"bit":2}},{"index":1472,"highByteIndex":1473,"bit7":{"index":1474,"bit":5}},{"index":1484,"highByteIndex":1485,"bit7":{"index":1490,"bit":1}},{"index":1495,"highByteIndex":1496,"bit7":{"index":1498,"bit":4}},{"index":1507,"highByteIndex":1508,"bit7":{"index":1514,"bit":0}},{"index":1518,"highByteIndex":1519,"bit7":{"index":1522,"bit":3}},{"index":1596,"highByteIndex":1597,"bit7":{"index":1602,"bit":1}},{"index":1607,"highByteIndex":1608,"bit7":{"index":1610,"bit":4}},{"index":1619,"highByteIndex":1620,"bit7":{"index":1626,"bit":0}},{"index":1630,"highByteIndex":1631,"bit7":{"index":1634,"bit":3}},{"index":1641,"highByteIndex":1643,"bit7":{"index":1642,"bit":6}},{"index":1653,"highByteIndex":1654,"bit7":{"index":1658,"bit":2}},{"index":1664,"highByteIndex":1665,"bit7":{"index":1666,"bit":5}},{"index":1676,"highByteIndex":1677,"bit7":{"index":1682,"bit":1}},{"index":1687,"highByteIndex":1688,"bit7":{"index":1690,"bit":4}}],
    values: ["20","20.5","21","21.5","22","22.5","23","23.5","24","24.5","25","25.5","26","27","27.5","28","28.5","29","30","30.5","31","32","32.5","33","34","34.5","35","36","37","38","38.5","39","40","41","42","43","44","45","46","47","48","49","50","51","52","53","54","56","57","58","59","61","62","63","65","66","68","69","71","72","74","75","77","79","80","82","84","86","88","90","92","94","96","98","100","102","104","107","109","111","114","116","119","121","124","127","130","132","135","138","141","145","148","151","154","158","161","165","168","172","176","180","184","188","192","196","200","205","209","214","218","223","228","233","238","243","249","254","260","266","271","277","284","290","296","303","309","316","323","330","337","345","352","360","368","376","384","393","401","410","419","428","438","447","457","467","478","488","499","510","521","532","544","556","568","581","594","607","620","634","647","662","676","691","706","722","738","754","770","787","805","822","840","859","878","897","917","937","957","979","1000","1020","1040","1070","1090","1110","1140","1160","1190","1210","1240","1270","1290","1320","1350","1380","1410","1440","1470","1500","1530","1570","1600","1640","1670","1710","1740","1780","1820","1860","1900","1940","1980","2030","2070","2110","2160","2210","2250","2300","2350","2400","2460","2510","2560","2620","2680","2730","2790","2850","2920","2980","3040","3110","3180","3240","3310","3390","3460","3530","3610","3690","3770","3850","3930","4020","4110","4190","4280","4380","4470","4570","4670","4770","4870","4980","5080","5190","5310","5420","5540","5660","5780","5910","6030","6160","6300","6430","6570","6720","6860","7010","7160","7320","7470","7640","7800","7970","8140","8320","8500","8680","8870","9060","9260","9460","9660","9870","10100","10300","10500","10800","11000","11200","11500","11700","12000","12200","12500","12800","13000","13300","13600","13900","14200","14500","14800","15100","15500","15800","16100","16500","16900","17200","17600","18000","18400","18800","19200","19600","20000"],
    unit: "Hz",
  },
  {
    name: "EQ Q",
    type: "enum",
    bands: [{"index":179},{"index":191},{"index":202},{"index":214},{"index":225},{"index":237},{"index":248},{"index":259},{"index":271},{"index":321},{"index":333},{"index":344},{"index":355},{"index":367},{"index":378},{"index":390},{"index":401},{"index":413},{"index":463},{"index":474},{"index":486},{"index":497},{"index":509},{"index":520},{"index":531},{"index":543},{"index":554},{"index":605},{"index":616},{"index":627},{"index":639},{"index":650},{"index":662},{"index":673},{"index":685},{"index":696},{"index":746},{"index":758},{"index":769},{"index":781},{"index":792},{"index":803},{"index":815},{"index":826},{"index":838},{"index":915},{"index":927},{"index":938},{"index":950},{"index":961},{"index":973},{"index":984},{"index":995},{"index":1013},{"index":1091},{"index":1102},{"index":1113},{"index":1125},{"index":1136},{"index":1148},{"index":1159},{"index":1171},{"index":1182},{"index":1260},{"index":1271},{"index":1283},{"index":1294},{"index":1305},{"index":1317},{"index":1328},{"index":1340},{"index":1351},{"index":1429},{"index":1440},{"index":1452},{"index":1463},{"index":1475},{"index":1486},{"index":1497},{"index":1509},{"index":1520},{"index":1598},{"index":1609},{"index":1621},{"index":1632},{"index":1644},{"index":1655},{"index":1667},{"index":1678},{"index":1689}],
    values: ["0.1","0.125","0.15","0.175","0.2","0.225","0.25","0.275","0.3","0.33","0.36","0.4","0.43","0.46","0.5","0.6","0.65","0.7","0.8","0.9","1.0","1.1","1.3","1.4","1.6","1.8","2.0","2.2","2.5","2.8","3.2","3.5","4.0","4.5","5.0","5.6","6.3","7.1","7.9","8.9","10"],
  },
  {
    name: "EQ Gain",
    type: "number",
    bands: [{"index":182,"highByteIndex":183,"bit7":{"index":188,"bit":1}},{"index":193,"highByteIndex":194,"bit7":{"index":196,"bit":4}},{"index":205,"highByteIndex":206,"bit7":{"index":212,"bit":0}},{"index":216,"highByteIndex":217,"bit7":{"index":220,"bit":3}},{"index":227,"highByteIndex":229,"bit7":{"index":228,"bit":6}},{"index":239,"highByteIndex":240,"bit7":{"index":244,"bit":2}},{"index":250,"highByteIndex":251,"bit7":{"index":252,"bit":5}},{"index":262,"highByteIndex":263,"bit7":{"index":268,"bit":1}},{"index":273,"highByteIndex":274,"bit7":{"index":276,"bit":4}},{"index":323,"highByteIndex":325,"bit7":{"index":324,"bit":6}},{"index":335,"highByteIndex":336,"bit7":{"index":340,"bit":2}},{"index":346,"highByteIndex":347,"bit7":{"index":348,"bit":5}},{"index":358,"highByteIndex":359,"bit7":{"index":364,"bit":1}},{"index":369,"highByteIndex":370,"bit7":{"index":372,"bit":4}},{"index":381,"highByteIndex":382,"bit7":{"index":388,"bit":0}},{"index":392,"highByteIndex":393,"bit7":{"index":396,"bit":3}},{"index":403,"highByteIndex":405,"bit7":{"index":404,"bit":6}},{"index":415,"highByteIndex":416,"bit7":{"index":420,"bit":2}},{"index":465,"highByteIndex":466,"bit7":{"index":468,"bit":4}},{"index":477,"highByteIndex":478,"bit7":{"index":484,"bit":0}},{"index":488,"highByteIndex":489,"bit7":{"index":492,"bit":3}},{"index":499,"highByteIndex":501,"bit7":{"index":500,"bit":6}},{"index":511,"highByteIndex":512,"bit7":{"index":516,"bit":2}},{"index":522,"highByteIndex":523,"bit7":{"index":524,"bit":5}},{"index":534,"highByteIndex":535,"bit7":{"index":540,"bit":1}},{"index":545,"highByteIndex":546,"bit7":{"index":548,"bit":4}},{"index":557,"highByteIndex":558,"bit7":{"index":564,"bit":0}},{"index":607,"highByteIndex":608,"bit7":{"index":612,"bit":2}},{"index":618,"highByteIndex":619,"bit7":{"index":620,"bit":5}},{"index":630,"highByteIndex":631,"bit7":{"index":636,"bit":1}},{"index":641,"highByteIndex":642,"bit7":{"index":644,"bit":4}},{"index":653,"highByteIndex":654,"bit7":{"index":660,"bit":0}},{"index":664,"highByteIndex":665,"bit7":{"index":668,"bit":3}},{"index":675,"highByteIndex":677,"bit7":{"index":676,"bit":6}},{"index":687,"highByteIndex":688,"bit7":{"index":692,"bit":2}},{"index":698,"highByteIndex":699,"bit7":{"index":700,"bit":5}},{"index":749,"highByteIndex":750,"bit7":{"index":756,"bit":0}},{"index":760,"highByteIndex":761,"bit7":{"index":764,"bit":3}},{"index":771,"highByteIndex":773,"bit7":{"index":772,"bit":6}},{"index":783,"highByteIndex":784,"bit7":{"index":788,"bit":2}},{"index":794,"highByteIndex":795,"bit7":{"index":796,"bit":5}},{"index":806,"highByteIndex":807,"bit7":{"index":812,"bit":1}},{"index":817,"highByteIndex":818,"bit7":{"index":820,"bit":4}},{"index":829,"highByteIndex":830,"bit7":{"index":836,"bit":0}},{"index":840,"highByteIndex":841,"bit7":{"index":844,"bit":3}},{"index":918,"highByteIndex":919,"bit7":{"index":924,"bit":1}},{"index":929,"highByteIndex":930,"bit7":{"index":932,"bit":4}},{"index":941,"highByteIndex":942,"bit7":{"index":948,"bit":0}},{"index":952,"highByteIndex":953,"bit7":{"index":956,"bit":3}},{"index":963,"highByteIndex":965,"bit7":{"index":964,"bit":6}},{"index":975,"highByteIndex":976,"bit7":{"index":980,"bit":2}},{"index":986,"highByteIndex":987,"bit7":{"index":988,"bit":5}},{"index":998,"highByteIndex":999,"bit7":{"index":1004,"bit":1}},{"index":1015,"highByteIndex":1016,"bit7":{"index":1018,"bit":4}},{"index":1093,"highByteIndex":1094,"bit7":{"index":1098,"bit":2}},{"index":1104,"highByteIndex":1105,"bit7":{"index":1106,"bit":5}},{"index":1116,"highByteIndex":1117,"bit7":{"index":1122,"bit":1}},{"index":1127,"highByteIndex":1128,"bit7":{"index":1130,"bit":4}},{"index":1139,"highByteIndex":1140,"bit7":{"index":1146,"bit":0}},{"index":1150,"highByteIndex":1151,"bit7":{"index":1154,"bit":3}},{"index":1161,"highByteIndex":1163,"bit7":{"index":1162,"bit":6}},{"index":1173,"highByteIndex":1174,"bit7":{"index":1178,"bit":2}},{"index":1184,"highByteIndex":1185,"bit7":{"index":1186,"bit":5}},{"index":1262,"highByteIndex":1263,"bit7":{"index":1266,"bit":3}},{"index":1273,"highByteIndex":1275,"bit7":{"index":1274,"bit":6}},{"index":1285,"highByteIndex":1286,"bit7":{"index":1290,"bit":2}},{"index":1296,"highByteIndex":1297,"bit7":{"index":1298,"bit":5}},{"index":1308,"highByteIndex":1309,"bit7":{"index":1314,"bit":1}},{"index":1319,"highByteIndex":1320,"bit7":{"index":1322,"bit":4}},{"index":1331,"highByteIndex":1332,"bit7":{"index":1338,"bit":0}},{"index":1342,"highByteIndex":1343,"bit7":{"index":1346,"bit":3}},{"index":1353,"highByteIndex":1355,"bit7":{"index":1354,"bit":6}},{"index":1431,"highByteIndex":1432,"bit7":{"index":1434,"bit":4}},{"index":1443,"highByteIndex":1444,"bit7":{"index":1450,"bit":0}},{"index":1454,"highByteIndex":1455,"bit7":{"index":1458,"bit":3}},{"index":1465,"highByteIndex":1467,"bit7":{"index":1466,"bit":6}},{"index":1477,"highByteIndex":1478,"bit7":{"index":1482,"bit":2}},{"index":1488,"highByteIndex":1489,"bit7":{"index":1490,"bit":5}},{"index":1500,"highByteIndex":1501,"bit7":{"index":1506,"bit":1}},{"index":1511,"highByteIndex":1512,"bit7":{"index":1514,"bit":4}},{"index":1523,"highByteIndex":1524,"bit7":{"index":1530,"bit":0}},{"index":1600,"highByteIndex":1601,"bit7":{"index":1602,"bit":5}},{"index":1612,"highByteIndex":1613,"bit7":{"index":1618,"bit":1}},{"index":1623,"highByteIndex":1624,"bit7":{"index":1626,"bit":4}},{"index":1635,"highByteIndex":1636,"bit7":{"index":1642,"bit":0}},{"index":1646,"highByteIndex":1647,"bit7":{"index":1650,"bit":3}},{"index":1657,"highByteIndex":1659,"bit7":{"index":1658,"bit":6}},{"index":1669,"highByteIndex":1670,"bit7":{"index":1674,"bit":2}},{"index":1680,"highByteIndex":1681,"bit7":{"index":1682,"bit":5}},{"index":1692,"highByteIndex":1693,"bit7":{"index":1698,"bit":1}}],
    unit: "dB",
    min: -15,
    max: 15,
    step: 0.1,
  },
  {
    name: "EQ Type",
    type: "enum",
    bands: [{"index":184},{"index":195},{"index":207},{"index":218},{"index":230},{"index":241},{"index":253},{"index":264},{"index":275},{"index":326},{"index":337},{"index":349},{"index":360},{"index":371},{"index":383},{"index":394},{"index":406},{"index":417},{"index":467},{"index":479},{"index":490},{"index":502},{"index":513},{"index":525},{"index":536},{"index":547},{"index":559},{"index":609},{"index":621},{"index":632},{"index":643},{"index":655},{"index":666},{"index":678},{"index":689},{"index":701},{"index":751},{"index":762},{"index":774},{"index":785},{"index":797},{"index":808},{"index":819},{"index":831},{"index":842},{"index":920},{"index":931},{"index":943},{"index":954},{"index":966},{"index":977},{"index":989},{"index":1000},{"index":1017},{"index":1095},{"index":1107},{"index":1118},{"index":1129},{"index":1141},{"index":1152},{"index":1164},{"index":1175},{"index":1187},{"index":1264},{"index":1276},{"index":1287},{"index":1299},{"index":1310},{"index":1321},{"index":1333},{"index":1344},{"index":1356},{"index":1433},{"index":1445},{"index":1456},{"index":1468},{"index":1479},{"index":1491},{"index":1502},{"index":1513},{"index":1525},{"index":1603},{"index":1614},{"index":1625},{"index":1637},{"index":1648},{"index":1660},{"index":1671},{"index":1683},{"index":1694}],
    values: ["Low Shelv","Bandpass","High Shelv"],
  },
  {
    name: "EQ Shelving",
    type: "enum",
    bands: [{"index":186},{"index":198},{"index":209},{"index":221},{"index":232},{"index":243},{"index":255},{"index":266},{"index":278},{"index":328},{"index":339},{"index":351},{"index":362},{"index":374},{"index":385},{"index":397},{"index":408},{"index":419},{"index":470},{"index":481},{"index":493},{"index":504},{"index":515},{"index":527},{"index":538},{"index":550},{"index":561},{"index":611},{"index":623},{"index":634},{"index":646},{"index":657},{"index":669},{"index":680},{"index":691},{"index":703},{"index":753},{"index":765},{"index":776},{"index":787},{"index":799},{"index":810},{"index":822},{"index":833},{"index":845},{"index":922},{"index":934},{"index":945},{"index":957},{"index":968},{"index":979},{"index":991},{"index":1002},{"index":1020},{"index":1097},{"index":1109},{"index":1120},{"index":1132},{"index":1143},{"index":1155},{"index":1166},{"index":1177},{"index":1189},{"index":1267},{"index":1278},{"index":1289},{"index":1301},{"index":1312},{"index":1324},{"index":1335},{"index":1347},{"index":1358},{"index":1436},{"index":1447},{"index":1459},{"index":1470},{"index":1481},{"index":1493},{"index":1504},{"index":1516},{"index":1527},{"index":1605},{"index":1616},{"index":1628},{"index":1639},{"index":1651},{"index":1662},{"index":1673},{"index":1685},{"index":1696}],
    values: ["6dB","12dB"],
  },
];
