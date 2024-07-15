const dayjs = require('dayjs')

exports.baseFileData = (data) =>
`<ENVELOPE>
 <HEADER>
  <TALLYREQUEST>Import Data</TALLYREQUEST>
 </HEADER>
 <BODY>
  <IMPORTDATA>
   <REQUESTDESC>
    <REPORTNAME>All Masters</REPORTNAME>
    <STATICVARIABLES>
     <SVCURRENTCOMPANY>SHREE KRISHNA NURSERY</SVCURRENTCOMPANY>
    </STATICVARIABLES>
   </REQUESTDESC>
   <REQUESTDATA>${data.map(ele=>ele).join('')}
   </REQUESTDATA>
  </IMPORTDATA>
 </BODY>
</ENVELOPE>
`


exports.txnData=({customerName, customerNumber, billedDate, paymentType, items, totalPrice, index, roundOff}) => 
    `
    <TALLYMESSAGE xmlns:UDF="TallyUDF">
     <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Invoice Voucher View">
      <ADDRESS.LIST TYPE="String">
       <ADDRESS>${customerName?.toUpperCase()}</ADDRESS>
       <ADDRESS>${customerNumber}</ADDRESS>
      </ADDRESS.LIST>
      <BASICBUYERADDRESS.LIST TYPE="String">
       <BASICBUYERADDRESS>${customerNumber}</BASICBUYERADDRESS>
      </BASICBUYERADDRESS.LIST>
      <OLDAUDITENTRYIDS.LIST TYPE="Number">
       <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
      </OLDAUDITENTRYIDS.LIST>
      <DATE>${dayjs(billedDate).format('YYYYMMDD')}</DATE>
      <GUID></GUID>
      <GSTREGISTRATIONTYPE>Unregistered</GSTREGISTRATIONTYPE>
      <VATDEALERTYPE>Unregistered</VATDEALERTYPE>
      <STATENAME>Karnataka</STATENAME>
      <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
      <COUNTRYOFRESIDENCE>India</COUNTRYOFRESIDENCE>
      <PLACEOFSUPPLY>Karnataka</PLACEOFSUPPLY>
      <PARTYNAME>${paymentType==='CASH' ? 'CASH' : customerName?.toUpperCase()}</PARTYNAME>
      <PARTYLEDGERNAME>${paymentType==='CASH' ? 'CASH' : customerName?.toUpperCase()}</PARTYLEDGERNAME>
      <PARTYMAILINGNAME>${paymentType==='CASH' ? 'CASH' : customerName?.toUpperCase()}</PARTYMAILINGNAME>
      <CONSIGNEEMAILINGNAME>${customerName?.toUpperCase()}</CONSIGNEEMAILINGNAME>
      <CONSIGNEESTATENAME>Karnataka</CONSIGNEESTATENAME>
      <VOUCHERNUMBER>${index}</VOUCHERNUMBER>
      <BASICBASEPARTYNAME>${paymentType==='CASH' ? 'CASH' : customerName?.toUpperCase()}</BASICBASEPARTYNAME>
      <CSTFORMISSUETYPE/>
      <CSTFORMRECVTYPE/>
      <FBTPAYMENTTYPE>Default</FBTPAYMENTTYPE>
      <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
      <BASICBUYERNAME>${paymentType==='CASH' ? 'CASH' : customerName?.toUpperCase()}</BASICBUYERNAME>
      <CONSIGNEECOUNTRYNAME>India</CONSIGNEECOUNTRYNAME>
      <VCHGSTCLASS/>
      <VCHENTRYMODE>Item Invoice</VCHENTRYMODE>
      <DIFFACTUALQTY>No</DIFFACTUALQTY>
      <ISMSTFROMSYNC>No</ISMSTFROMSYNC>
      <ISDELETED>No</ISDELETED>
      <ISSECURITYONWHENENTERED>No</ISSECURITYONWHENENTERED>
      <ASORIGINAL>No</ASORIGINAL>
      <AUDITED>No</AUDITED>
      <FORJOBCOSTING>No</FORJOBCOSTING>
      <ISOPTIONAL>No</ISOPTIONAL>
      <EFFECTIVEDATE>${dayjs(billedDate).format('YYYYMMDD')}</EFFECTIVEDATE>
      <USEFOREXCISE>No</USEFOREXCISE>
      <ISFORJOBWORKIN>No</ISFORJOBWORKIN>
      <ALLOWCONSUMPTION>No</ALLOWCONSUMPTION>
      <USEFORINTEREST>No</USEFORINTEREST>
      <USEFORGAINLOSS>No</USEFORGAINLOSS>
      <USEFORGODOWNTRANSFER>No</USEFORGODOWNTRANSFER>
      <USEFORCOMPOUND>No</USEFORCOMPOUND>
      <USEFORSERVICETAX>No</USEFORSERVICETAX>
      <ISONHOLD>No</ISONHOLD>
      <ISBOENOTAPPLICABLE>No</ISBOENOTAPPLICABLE>
      <ISGSTSECSEVENAPPLICABLE>No</ISGSTSECSEVENAPPLICABLE>
      <ISEXCISEVOUCHER>No</ISEXCISEVOUCHER>
      <EXCISETAXOVERRIDE>No</EXCISETAXOVERRIDE>
      <USEFORTAXUNITTRANSFER>No</USEFORTAXUNITTRANSFER>
      <IGNOREPOSVALIDATION>No</IGNOREPOSVALIDATION>
      <EXCISEOPENING>No</EXCISEOPENING>
      <USEFORFINALPRODUCTION>No</USEFORFINALPRODUCTION>
      <ISTDSOVERRIDDEN>No</ISTDSOVERRIDDEN>
      <ISTCSOVERRIDDEN>No</ISTCSOVERRIDDEN>
      <ISTDSTCSCASHVCH>No</ISTDSTCSCASHVCH>
      <INCLUDEADVPYMTVCH>No</INCLUDEADVPYMTVCH>
      <ISSUBWORKSCONTRACT>No</ISSUBWORKSCONTRACT>
      <ISVATOVERRIDDEN>No</ISVATOVERRIDDEN>
      <IGNOREORIGVCHDATE>No</IGNOREORIGVCHDATE>
      <ISVATPAIDATCUSTOMS>No</ISVATPAIDATCUSTOMS>
      <ISDECLAREDTOCUSTOMS>No</ISDECLAREDTOCUSTOMS>
      <ISSERVICETAXOVERRIDDEN>No</ISSERVICETAXOVERRIDDEN>
      <ISISDVOUCHER>No</ISISDVOUCHER>
      <ISEXCISEOVERRIDDEN>No</ISEXCISEOVERRIDDEN>
      <ISEXCISESUPPLYVCH>No</ISEXCISESUPPLYVCH>
      <ISGSTOVERRIDDEN>No</ISGSTOVERRIDDEN>
      <GSTNOTEXPORTED>No</GSTNOTEXPORTED>
      <IGNOREGSTINVALIDATION>No</IGNOREGSTINVALIDATION>
      <ISGSTREFUND>No</ISGSTREFUND>
      <OVRDNEWAYBILLAPPLICABILITY>No</OVRDNEWAYBILLAPPLICABILITY>
      <ISVATPRINCIPALACCOUNT>No</ISVATPRINCIPALACCOUNT>
      <IGNOREEINVVALIDATION>No</IGNOREEINVVALIDATION>
      <IRNJSONEXPORTED>No</IRNJSONEXPORTED>
      <IRNCANCELLED>No</IRNCANCELLED>
      <ISSHIPPINGWITHINSTATE>No</ISSHIPPINGWITHINSTATE>
      <ISOVERSEASTOURISTTRANS>No</ISOVERSEASTOURISTTRANS>
      <ISDESIGNATEDZONEPARTY>No</ISDESIGNATEDZONEPARTY>
      <ISCANCELLED>No</ISCANCELLED>
      <HASCASHFLOW>${paymentType==='CASH' ? 'Yes': 'No'}</HASCASHFLOW>
      <ISPOSTDATED>No</ISPOSTDATED>
      <USETRACKINGNUMBER>No</USETRACKINGNUMBER>
      <ISINVOICE>Yes</ISINVOICE>
      <MFGJOURNAL>No</MFGJOURNAL>
      <HASDISCOUNTS>No</HASDISCOUNTS>
      <ASPAYSLIP>No</ASPAYSLIP>
      <ISCOSTCENTRE>No</ISCOSTCENTRE>
      <ISSTXNONREALIZEDVCH>No</ISSTXNONREALIZEDVCH>
      <ISEXCISEMANUFACTURERON>No</ISEXCISEMANUFACTURERON>
      <ISBLANKCHEQUE>No</ISBLANKCHEQUE>
      <ISVOID>No</ISVOID>
      <ORDERLINESTATUS>No</ORDERLINESTATUS>
      <VATISAGNSTCANCSALES>No</VATISAGNSTCANCSALES>
      <VATISPURCEXEMPTED>No</VATISPURCEXEMPTED>
      <ISVATRESTAXINVOICE>No</ISVATRESTAXINVOICE>
      <VATISASSESABLECALCVCH>No</VATISASSESABLECALCVCH>
      <ISVATDUTYPAID>Yes</ISVATDUTYPAID>
      <ISDELIVERYSAMEASCONSIGNEE>No</ISDELIVERYSAMEASCONSIGNEE>
      <ISDISPATCHSAMEASCONSIGNOR>No</ISDISPATCHSAMEASCONSIGNOR>
      <ISDELETEDVCHRETAINED>No</ISDELETEDVCHRETAINED>
      <CHANGEVCHMODE>No</CHANGEVCHMODE>
      <RESETIRNQRCODE>No</RESETIRNQRCODE>
      <ALTERID> </ALTERID>
      <MASTERID> </MASTERID>
      <VOUCHERKEY></VOUCHERKEY>
      <EWAYBILLDETAILS.LIST>      </EWAYBILLDETAILS.LIST>
      <EXCLUDEDTAXATIONS.LIST>      </EXCLUDEDTAXATIONS.LIST>
      <OLDAUDITENTRIES.LIST>      </OLDAUDITENTRIES.LIST>
      <ACCOUNTAUDITENTRIES.LIST>      </ACCOUNTAUDITENTRIES.LIST>
      <AUDITENTRIES.LIST>      </AUDITENTRIES.LIST>
      <DUTYHEADDETAILS.LIST>      </DUTYHEADDETAILS.LIST>
      ${items.map(({procurementName, rate, quantity})=>(
      `<ALLINVENTORYENTRIES.LIST>
       <STOCKITEMNAME>${procurementName}</STOCKITEMNAME>
       <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
       <ISLASTDEEMEDPOSITIVE>No</ISLASTDEEMEDPOSITIVE>
       <ISAUTONEGATE>No</ISAUTONEGATE>
       <ISCUSTOMSCLEARANCE>No</ISCUSTOMSCLEARANCE>
       <ISTRACKCOMPONENT>No</ISTRACKCOMPONENT>
       <ISTRACKPRODUCTION>No</ISTRACKPRODUCTION>
       <ISPRIMARYITEM>No</ISPRIMARYITEM>
       <ISSCRAP>No</ISSCRAP>
       <RATE>${rate}.00/NOs</RATE>
       <AMOUNT>${rate*quantity}.00</AMOUNT>
       <ACTUALQTY> ${quantity} NOs</ACTUALQTY>
       <BILLEDQTY> ${quantity} NOs</BILLEDQTY>
       <BATCHALLOCATIONS.LIST>
        <GODOWNNAME>Main Location</GODOWNNAME>
        <BATCHNAME>Primary Batch</BATCHNAME>
        <INDENTNO/>
        <ORDERNO/>
        <TRACKINGNUMBER/>
        <DYNAMICCSTISCLEARED>No</DYNAMICCSTISCLEARED>
        <AMOUNT>${rate*quantity}.00</AMOUNT>
        <ACTUALQTY> ${quantity} NOs</ACTUALQTY>
        <BILLEDQTY> ${quantity} NOs</BILLEDQTY>
        <ADDITIONALDETAILS.LIST>        </ADDITIONALDETAILS.LIST>
        <VOUCHERCOMPONENTLIST.LIST>        </VOUCHERCOMPONENTLIST.LIST>
       </BATCHALLOCATIONS.LIST>
       <ACCOUNTINGALLOCATIONS.LIST>
        <OLDAUDITENTRYIDS.LIST TYPE="Number">
         <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
        </OLDAUDITENTRYIDS.LIST>
        <LEDGERNAME>Sales Exempted</LEDGERNAME>
        <GSTCLASS/>
        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
        <LEDGERFROMITEM>No</LEDGERFROMITEM>
        <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
        <ISPARTYLEDGER>No</ISPARTYLEDGER>
        <ISLASTDEEMEDPOSITIVE>No</ISLASTDEEMEDPOSITIVE>
        <ISCAPVATTAXALTERED>No</ISCAPVATTAXALTERED>
        <ISCAPVATNOTCLAIMED>No</ISCAPVATNOTCLAIMED>
        <AMOUNT>${rate*quantity}.00</AMOUNT>
        <SERVICETAXDETAILS.LIST>        </SERVICETAXDETAILS.LIST>
        <BANKALLOCATIONS.LIST>        </BANKALLOCATIONS.LIST>
        <BILLALLOCATIONS.LIST>        </BILLALLOCATIONS.LIST>
        <INTERESTCOLLECTION.LIST>        </INTERESTCOLLECTION.LIST>
        <OLDAUDITENTRIES.LIST>        </OLDAUDITENTRIES.LIST>
        <ACCOUNTAUDITENTRIES.LIST>        </ACCOUNTAUDITENTRIES.LIST>
        <AUDITENTRIES.LIST>        </AUDITENTRIES.LIST>
        <INPUTCRALLOCS.LIST>        </INPUTCRALLOCS.LIST>
        <DUTYHEADDETAILS.LIST>        </DUTYHEADDETAILS.LIST>
        <EXCISEDUTYHEADDETAILS.LIST>        </EXCISEDUTYHEADDETAILS.LIST>
        <RATEDETAILS.LIST>        </RATEDETAILS.LIST>
        <SUMMARYALLOCS.LIST>        </SUMMARYALLOCS.LIST>
        <STPYMTDETAILS.LIST>        </STPYMTDETAILS.LIST>
        <EXCISEPAYMENTALLOCATIONS.LIST>        </EXCISEPAYMENTALLOCATIONS.LIST>
        <TAXBILLALLOCATIONS.LIST>        </TAXBILLALLOCATIONS.LIST>
        <TAXOBJECTALLOCATIONS.LIST>        </TAXOBJECTALLOCATIONS.LIST>
        <TDSEXPENSEALLOCATIONS.LIST>        </TDSEXPENSEALLOCATIONS.LIST>
        <VATSTATUTORYDETAILS.LIST>        </VATSTATUTORYDETAILS.LIST>
        <COSTTRACKALLOCATIONS.LIST>        </COSTTRACKALLOCATIONS.LIST>
        <REFVOUCHERDETAILS.LIST>        </REFVOUCHERDETAILS.LIST>
        <INVOICEWISEDETAILS.LIST>        </INVOICEWISEDETAILS.LIST>
        <VATITCDETAILS.LIST>        </VATITCDETAILS.LIST>
        <ADVANCETAXDETAILS.LIST>        </ADVANCETAXDETAILS.LIST>
       </ACCOUNTINGALLOCATIONS.LIST>
       <DUTYHEADDETAILS.LIST>       </DUTYHEADDETAILS.LIST>
       <SUPPLEMENTARYDUTYHEADDETAILS.LIST>       </SUPPLEMENTARYDUTYHEADDETAILS.LIST>
       <TAXOBJECTALLOCATIONS.LIST>       </TAXOBJECTALLOCATIONS.LIST>
       <REFVOUCHERDETAILS.LIST>       </REFVOUCHERDETAILS.LIST>
       <EXCISEALLOCATIONS.LIST>       </EXCISEALLOCATIONS.LIST>
       <EXPENSEALLOCATIONS.LIST>       </EXPENSEALLOCATIONS.LIST>
      </ALLINVENTORYENTRIES.LIST>
      `
      )).join('')}<SUPPLEMENTARYDUTYHEADDETAILS.LIST>      </SUPPLEMENTARYDUTYHEADDETAILS.LIST>
      <EWAYBILLERRORLIST.LIST>      </EWAYBILLERRORLIST.LIST>
      <IRNERRORLIST.LIST>      </IRNERRORLIST.LIST>
      <INVOICEDELNOTES.LIST>      </INVOICEDELNOTES.LIST>
      <INVOICEORDERLIST.LIST>      </INVOICEORDERLIST.LIST>
      <INVOICEINDENTLIST.LIST>      </INVOICEINDENTLIST.LIST>
      <ATTENDANCEENTRIES.LIST>      </ATTENDANCEENTRIES.LIST>
      <ORIGINVOICEDETAILS.LIST>      </ORIGINVOICEDETAILS.LIST>
      <INVOICEEXPORTLIST.LIST>      </INVOICEEXPORTLIST.LIST>
      <LEDGERENTRIES.LIST>
       <OLDAUDITENTRYIDS.LIST TYPE="Number">
        <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
       </OLDAUDITENTRYIDS.LIST>
       <LEDGERNAME>${paymentType==='CASH' ? 'CASH' : customerName?.toUpperCase()}</LEDGERNAME>
       <GSTCLASS/>
       <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
       <LEDGERFROMITEM>No</LEDGERFROMITEM>
       <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
       <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
       <ISLASTDEEMEDPOSITIVE>Yes</ISLASTDEEMEDPOSITIVE>
       <ISCAPVATTAXALTERED>No</ISCAPVATTAXALTERED>
       <ISCAPVATNOTCLAIMED>No</ISCAPVATNOTCLAIMED>
       ${totalPrice ? `<AMOUNT>-${totalPrice}.00</AMOUNT>` : ''}
       <SERVICETAXDETAILS.LIST>       </SERVICETAXDETAILS.LIST>
       <BANKALLOCATIONS.LIST>       </BANKALLOCATIONS.LIST>
       <BILLALLOCATIONS.LIST>       </BILLALLOCATIONS.LIST>
       <INTERESTCOLLECTION.LIST>       </INTERESTCOLLECTION.LIST>
       <OLDAUDITENTRIES.LIST>       </OLDAUDITENTRIES.LIST>
       <ACCOUNTAUDITENTRIES.LIST>       </ACCOUNTAUDITENTRIES.LIST>
       <AUDITENTRIES.LIST>       </AUDITENTRIES.LIST>
       <INPUTCRALLOCS.LIST>       </INPUTCRALLOCS.LIST>
       <DUTYHEADDETAILS.LIST>       </DUTYHEADDETAILS.LIST>
       <EXCISEDUTYHEADDETAILS.LIST>       </EXCISEDUTYHEADDETAILS.LIST>
       <RATEDETAILS.LIST>       </RATEDETAILS.LIST>
       <SUMMARYALLOCS.LIST>       </SUMMARYALLOCS.LIST>
       <STPYMTDETAILS.LIST>       </STPYMTDETAILS.LIST>
       <EXCISEPAYMENTALLOCATIONS.LIST>       </EXCISEPAYMENTALLOCATIONS.LIST>
       <TAXBILLALLOCATIONS.LIST>       </TAXBILLALLOCATIONS.LIST>
       <TAXOBJECTALLOCATIONS.LIST>       </TAXOBJECTALLOCATIONS.LIST>
       <TDSEXPENSEALLOCATIONS.LIST>       </TDSEXPENSEALLOCATIONS.LIST>
       <VATSTATUTORYDETAILS.LIST>       </VATSTATUTORYDETAILS.LIST>
       <COSTTRACKALLOCATIONS.LIST>       </COSTTRACKALLOCATIONS.LIST>
       <REFVOUCHERDETAILS.LIST>       </REFVOUCHERDETAILS.LIST>
       <INVOICEWISEDETAILS.LIST>       </INVOICEWISEDETAILS.LIST>
       <VATITCDETAILS.LIST>       </VATITCDETAILS.LIST>
       <ADVANCETAXDETAILS.LIST>       </ADVANCETAXDETAILS.LIST>
      </LEDGERENTRIES.LIST>
      ${roundOff ? `<LEDGERENTRIES.LIST>
       <OLDAUDITENTRYIDS.LIST TYPE="Number">
        <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
       </OLDAUDITENTRYIDS.LIST>
       <LEDGERNAME>Round Off</LEDGERNAME>
       <GSTCLASS/>
       <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
       <LEDGERFROMITEM>No</LEDGERFROMITEM>
       <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
       <ISPARTYLEDGER>No</ISPARTYLEDGER>
       <ISLASTDEEMEDPOSITIVE>No</ISLASTDEEMEDPOSITIVE>
       <ISCAPVATTAXALTERED>No</ISCAPVATTAXALTERED>
       <ISCAPVATNOTCLAIMED>No</ISCAPVATNOTCLAIMED>
       <AMOUNT>-${roundOff}.00</AMOUNT>
       <VATEXPAMOUNT>-${roundOff}.00</VATEXPAMOUNT>
       <SERVICETAXDETAILS.LIST>       </SERVICETAXDETAILS.LIST>
       <BANKALLOCATIONS.LIST>       </BANKALLOCATIONS.LIST>
       <BILLALLOCATIONS.LIST>       </BILLALLOCATIONS.LIST>
       <INTERESTCOLLECTION.LIST>       </INTERESTCOLLECTION.LIST>
       <OLDAUDITENTRIES.LIST>       </OLDAUDITENTRIES.LIST>
       <ACCOUNTAUDITENTRIES.LIST>       </ACCOUNTAUDITENTRIES.LIST>
       <AUDITENTRIES.LIST>       </AUDITENTRIES.LIST>
       <INPUTCRALLOCS.LIST>       </INPUTCRALLOCS.LIST>
       <DUTYHEADDETAILS.LIST>       </DUTYHEADDETAILS.LIST>
       <EXCISEDUTYHEADDETAILS.LIST>       </EXCISEDUTYHEADDETAILS.LIST>
       <RATEDETAILS.LIST>       </RATEDETAILS.LIST>
       <SUMMARYALLOCS.LIST>       </SUMMARYALLOCS.LIST>
       <STPYMTDETAILS.LIST>       </STPYMTDETAILS.LIST>
       <EXCISEPAYMENTALLOCATIONS.LIST>       </EXCISEPAYMENTALLOCATIONS.LIST>
       <TAXBILLALLOCATIONS.LIST>       </TAXBILLALLOCATIONS.LIST>
       <TAXOBJECTALLOCATIONS.LIST>       </TAXOBJECTALLOCATIONS.LIST>
       <TDSEXPENSEALLOCATIONS.LIST>       </TDSEXPENSEALLOCATIONS.LIST>
       <VATSTATUTORYDETAILS.LIST>       </VATSTATUTORYDETAILS.LIST>
       <COSTTRACKALLOCATIONS.LIST>       </COSTTRACKALLOCATIONS.LIST>
       <REFVOUCHERDETAILS.LIST>       </REFVOUCHERDETAILS.LIST>
       <INVOICEWISEDETAILS.LIST>       </INVOICEWISEDETAILS.LIST>
       <VATITCDETAILS.LIST>       </VATITCDETAILS.LIST>
       <ADVANCETAXDETAILS.LIST>       </ADVANCETAXDETAILS.LIST>
      </LEDGERENTRIES.LIST>`:''}<PAYROLLMODEOFPAYMENT.LIST>      </PAYROLLMODEOFPAYMENT.LIST>
      <ATTDRECORDS.LIST>      </ATTDRECORDS.LIST>
      <GSTEWAYCONSIGNORADDRESS.LIST>      </GSTEWAYCONSIGNORADDRESS.LIST>
      <GSTEWAYCONSIGNEEADDRESS.LIST>      </GSTEWAYCONSIGNEEADDRESS.LIST>
      <TEMPGSTRATEDETAILS.LIST>      </TEMPGSTRATEDETAILS.LIST>
     </VOUCHER>
    </TALLYMESSAGE>`


exports.baseLedgerData=(data)=>
`<ENVELOPE>
 <HEADER>
  <TALLYREQUEST>Import Data</TALLYREQUEST>
 </HEADER>
 <BODY>
  <IMPORTDATA>
   <REQUESTDESC>
    <REPORTNAME>All Masters</REPORTNAME>
    <STATICVARIABLES>
     <SVCURRENTCOMPANY>SHREE KRISHNA NURSERY</SVCURRENTCOMPANY>
    </STATICVARIABLES>
   </REQUESTDESC>
   <REQUESTDATA>${data.map(ele=>ele).join('')}
   </REQUESTDATA>
  </IMPORTDATA>
 </BODY>
</ENVELOPE>
`
exports.ledgerData=({customerName})=>
    `
    <TALLYMESSAGE xmlns:UDF="TallyUDF">
     <LEDGER NAME="${customerName?.toUpperCase()}" RESERVEDNAME="">
      <MAILINGNAME.LIST TYPE="String">
       <MAILINGNAME>${customerName?.toUpperCase()}</MAILINGNAME>
      </MAILINGNAME.LIST>
      <OLDAUDITENTRYIDS.LIST TYPE="Number">
       <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
      </OLDAUDITENTRYIDS.LIST>
      <GUID></GUID>
      <CURRENCYNAME>₹</CURRENCYNAME>
      <PRIORSTATENAME>Karnataka</PRIORSTATENAME>
      <COUNTRYNAME>India</COUNTRYNAME>
      <GSTREGISTRATIONTYPE>Consumer</GSTREGISTRATIONTYPE>
      <VATDEALERTYPE>Regular</VATDEALERTYPE>
      <PARENT>Sundry Debtors</PARENT>
      <TAXCLASSIFICATIONNAME/>
      <TAXTYPE>Others</TAXTYPE>
      <COUNTRYOFRESIDENCE>India</COUNTRYOFRESIDENCE>
      <GSTTYPE/>
      <APPROPRIATEFOR/>
      <LEDSTATENAME>Karnataka</LEDSTATENAME>
      <SERVICECATEGORY>&#4; Not Applicable</SERVICECATEGORY>
      <EXCISELEDGERCLASSIFICATION/>
      <EXCISEDUTYTYPE/>
      <EXCISENATUREOFPURCHASE/>
      <LEDGERFBTCATEGORY/>
      <ISBILLWISEON>No</ISBILLWISEON>
      <ISCOSTCENTRESON>No</ISCOSTCENTRESON>
      <ISINTERESTON>No</ISINTERESTON>
      <ALLOWINMOBILE>No</ALLOWINMOBILE>
      <ISCOSTTRACKINGON>No</ISCOSTTRACKINGON>
      <ISBENEFICIARYCODEON>No</ISBENEFICIARYCODEON>
      <ISEXPORTONVCHCREATE>No</ISEXPORTONVCHCREATE>
      <PLASINCOMEEXPENSE>No</PLASINCOMEEXPENSE>
      <ISUPDATINGTARGETID>No</ISUPDATINGTARGETID>
      <ISDELETED>No</ISDELETED>
      <ISSECURITYONWHENENTERED>No</ISSECURITYONWHENENTERED>
      <ASORIGINAL>Yes</ASORIGINAL>
      <ISCONDENSED>No</ISCONDENSED>
      <AFFECTSSTOCK>No</AFFECTSSTOCK>
      <ISRATEINCLUSIVEVAT>No</ISRATEINCLUSIVEVAT>
      <FORPAYROLL>No</FORPAYROLL>
      <ISABCENABLED>No</ISABCENABLED>
      <ISCREDITDAYSCHKON>No</ISCREDITDAYSCHKON>
      <INTERESTONBILLWISE>No</INTERESTONBILLWISE>
      <OVERRIDEINTEREST>No</OVERRIDEINTEREST>
      <OVERRIDEADVINTEREST>No</OVERRIDEADVINTEREST>
      <USEFORVAT>No</USEFORVAT>
      <IGNORETDSEXEMPT>No</IGNORETDSEXEMPT>
      <ISTCSAPPLICABLE>No</ISTCSAPPLICABLE>
      <ISTDSAPPLICABLE>No</ISTDSAPPLICABLE>
      <ISFBTAPPLICABLE>No</ISFBTAPPLICABLE>
      <ISGSTAPPLICABLE>No</ISGSTAPPLICABLE>
      <ISEXCISEAPPLICABLE>No</ISEXCISEAPPLICABLE>
      <ISTDSEXPENSE>No</ISTDSEXPENSE>
      <ISEDLIAPPLICABLE>No</ISEDLIAPPLICABLE>
      <ISRELATEDPARTY>No</ISRELATEDPARTY>
      <USEFORESIELIGIBILITY>No</USEFORESIELIGIBILITY>
      <ISINTERESTINCLLASTDAY>No</ISINTERESTINCLLASTDAY>
      <APPROPRIATETAXVALUE>No</APPROPRIATETAXVALUE>
      <ISBEHAVEASDUTY>No</ISBEHAVEASDUTY>
      <INTERESTINCLDAYOFADDITION>No</INTERESTINCLDAYOFADDITION>
      <INTERESTINCLDAYOFDEDUCTION>No</INTERESTINCLDAYOFDEDUCTION>
      <ISOTHTERRITORYASSESSEE>No</ISOTHTERRITORYASSESSEE>
      <IGNOREMISMATCHWITHWARNING>No</IGNOREMISMATCHWITHWARNING>
      <USEASNOTIONALBANK>No</USEASNOTIONALBANK>
      <OVERRIDECREDITLIMIT>No</OVERRIDECREDITLIMIT>
      <ISAGAINSTFORMC>No</ISAGAINSTFORMC>
      <ISCHEQUEPRINTINGENABLED>Yes</ISCHEQUEPRINTINGENABLED>
      <ISPAYUPLOAD>No</ISPAYUPLOAD>
      <ISPAYBATCHONLYSAL>No</ISPAYBATCHONLYSAL>
      <ISBNFCODESUPPORTED>No</ISBNFCODESUPPORTED>
      <ALLOWEXPORTWITHERRORS>No</ALLOWEXPORTWITHERRORS>
      <CONSIDERPURCHASEFOREXPORT>No</CONSIDERPURCHASEFOREXPORT>
      <ISTRANSPORTER>No</ISTRANSPORTER>
      <USEFORNOTIONALITC>No</USEFORNOTIONALITC>
      <ISECOMMOPERATOR>No</ISECOMMOPERATOR>
      <OVERRIDEBASEDONREALIZATION>No</OVERRIDEBASEDONREALIZATION>
      <SHOWINPAYSLIP>No</SHOWINPAYSLIP>
      <USEFORGRATUITY>No</USEFORGRATUITY>
      <ISTDSPROJECTED>No</ISTDSPROJECTED>
      <FORSERVICETAX>No</FORSERVICETAX>
      <ISINPUTCREDIT>No</ISINPUTCREDIT>
      <ISEXEMPTED>No</ISEXEMPTED>
      <ISABATEMENTAPPLICABLE>No</ISABATEMENTAPPLICABLE>
      <ISSTXPARTY>No</ISSTXPARTY>
      <ISSTXNONREALIZEDTYPE>No</ISSTXNONREALIZEDTYPE>
      <ISUSEDFORCVD>No</ISUSEDFORCVD>
      <LEDBELONGSTONONTAXABLE>No</LEDBELONGSTONONTAXABLE>
      <ISEXCISEMERCHANTEXPORTER>No</ISEXCISEMERCHANTEXPORTER>
      <ISPARTYEXEMPTED>No</ISPARTYEXEMPTED>
      <ISSEZPARTY>No</ISSEZPARTY>
      <TDSDEDUCTEEISSPECIALRATE>No</TDSDEDUCTEEISSPECIALRATE>
      <ISECHEQUESUPPORTED>No</ISECHEQUESUPPORTED>
      <ISEDDSUPPORTED>No</ISEDDSUPPORTED>
      <HASECHEQUEDELIVERYMODE>No</HASECHEQUEDELIVERYMODE>
      <HASECHEQUEDELIVERYTO>No</HASECHEQUEDELIVERYTO>
      <HASECHEQUEPRINTLOCATION>No</HASECHEQUEPRINTLOCATION>
      <HASECHEQUEPAYABLELOCATION>No</HASECHEQUEPAYABLELOCATION>
      <HASECHEQUEBANKLOCATION>No</HASECHEQUEBANKLOCATION>
      <HASEDDDELIVERYMODE>No</HASEDDDELIVERYMODE>
      <HASEDDDELIVERYTO>No</HASEDDDELIVERYTO>
      <HASEDDPRINTLOCATION>No</HASEDDPRINTLOCATION>
      <HASEDDPAYABLELOCATION>No</HASEDDPAYABLELOCATION>
      <HASEDDBANKLOCATION>No</HASEDDBANKLOCATION>
      <ISEBANKINGENABLED>No</ISEBANKINGENABLED>
      <ISEXPORTFILEENCRYPTED>No</ISEXPORTFILEENCRYPTED>
      <ISBATCHENABLED>No</ISBATCHENABLED>
      <ISPRODUCTCODEBASED>No</ISPRODUCTCODEBASED>
      <HASEDDCITY>No</HASEDDCITY>
      <HASECHEQUECITY>No</HASECHEQUECITY>
      <ISFILENAMEFORMATSUPPORTED>No</ISFILENAMEFORMATSUPPORTED>
      <HASCLIENTCODE>No</HASCLIENTCODE>
      <PAYINSISBATCHAPPLICABLE>No</PAYINSISBATCHAPPLICABLE>
      <PAYINSISFILENUMAPP>No</PAYINSISFILENUMAPP>
      <ISSALARYTRANSGROUPEDFORBRS>No</ISSALARYTRANSGROUPEDFORBRS>
      <ISEBANKINGSUPPORTED>No</ISEBANKINGSUPPORTED>
      <ISSCBUAE>No</ISSCBUAE>
      <ISBANKSTATUSAPP>No</ISBANKSTATUSAPP>
      <ISSALARYGROUPED>No</ISSALARYGROUPED>
      <USEFORPURCHASETAX>No</USEFORPURCHASETAX>
      <AUDITED>No</AUDITED>
      <SORTPOSITION> 1000</SORTPOSITION>
      <ALTERID> 1160</ALTERID>
      <SERVICETAXDETAILS.LIST>      </SERVICETAXDETAILS.LIST>
      <LBTREGNDETAILS.LIST>      </LBTREGNDETAILS.LIST>
      <VATDETAILS.LIST>      </VATDETAILS.LIST>
      <SALESTAXCESSDETAILS.LIST>      </SALESTAXCESSDETAILS.LIST>
      <GSTDETAILS.LIST>      </GSTDETAILS.LIST>
      <LANGUAGENAME.LIST>
       <NAME.LIST TYPE="String">
        <NAME>${customerName?.toUpperCase()}</NAME>
       </NAME.LIST>
       <LANGUAGEID> 1033</LANGUAGEID>
      </LANGUAGENAME.LIST>
      <XBRLDETAIL.LIST>      </XBRLDETAIL.LIST>
      <AUDITDETAILS.LIST>      </AUDITDETAILS.LIST>
      <SCHVIDETAILS.LIST>      </SCHVIDETAILS.LIST>
      <EXCISETARIFFDETAILS.LIST>      </EXCISETARIFFDETAILS.LIST>
      <TCSCATEGORYDETAILS.LIST>      </TCSCATEGORYDETAILS.LIST>
      <TDSCATEGORYDETAILS.LIST>      </TDSCATEGORYDETAILS.LIST>
      <SLABPERIOD.LIST>      </SLABPERIOD.LIST>
      <GRATUITYPERIOD.LIST>      </GRATUITYPERIOD.LIST>
      <ADDITIONALCOMPUTATIONS.LIST>      </ADDITIONALCOMPUTATIONS.LIST>
      <EXCISEJURISDICTIONDETAILS.LIST>      </EXCISEJURISDICTIONDETAILS.LIST>
      <EXCLUDEDTAXATIONS.LIST>      </EXCLUDEDTAXATIONS.LIST>
      <BANKALLOCATIONS.LIST>      </BANKALLOCATIONS.LIST>
      <PAYMENTDETAILS.LIST>      </PAYMENTDETAILS.LIST>
      <BANKEXPORTFORMATS.LIST>      </BANKEXPORTFORMATS.LIST>
      <BILLALLOCATIONS.LIST>      </BILLALLOCATIONS.LIST>
      <INTERESTCOLLECTION.LIST>      </INTERESTCOLLECTION.LIST>
      <LEDGERCLOSINGVALUES.LIST>      </LEDGERCLOSINGVALUES.LIST>
      <LEDGERAUDITCLASS.LIST>      </LEDGERAUDITCLASS.LIST>
      <OLDAUDITENTRIES.LIST>      </OLDAUDITENTRIES.LIST>
      <TDSEXEMPTIONRULES.LIST>      </TDSEXEMPTIONRULES.LIST>
      <DEDUCTINSAMEVCHRULES.LIST>      </DEDUCTINSAMEVCHRULES.LIST>
      <LOWERDEDUCTION.LIST>      </LOWERDEDUCTION.LIST>
      <STXABATEMENTDETAILS.LIST>      </STXABATEMENTDETAILS.LIST>
      <LEDMULTIADDRESSLIST.LIST>      </LEDMULTIADDRESSLIST.LIST>
      <STXTAXDETAILS.LIST>      </STXTAXDETAILS.LIST>
      <CHEQUERANGE.LIST>      </CHEQUERANGE.LIST>
      <DEFAULTVCHCHEQUEDETAILS.LIST>      </DEFAULTVCHCHEQUEDETAILS.LIST>
      <ACCOUNTAUDITENTRIES.LIST>      </ACCOUNTAUDITENTRIES.LIST>
      <AUDITENTRIES.LIST>      </AUDITENTRIES.LIST>
      <BRSIMPORTEDINFO.LIST>      </BRSIMPORTEDINFO.LIST>
      <AUTOBRSCONFIGS.LIST>      </AUTOBRSCONFIGS.LIST>
      <BANKURENTRIES.LIST>      </BANKURENTRIES.LIST>
      <DEFAULTCHEQUEDETAILS.LIST>      </DEFAULTCHEQUEDETAILS.LIST>
      <DEFAULTOPENINGCHEQUEDETAILS.LIST>      </DEFAULTOPENINGCHEQUEDETAILS.LIST>
      <CANCELLEDPAYALLOCATIONS.LIST>      </CANCELLEDPAYALLOCATIONS.LIST>
      <ECHEQUEPRINTLOCATION.LIST>      </ECHEQUEPRINTLOCATION.LIST>
      <ECHEQUEPAYABLELOCATION.LIST>      </ECHEQUEPAYABLELOCATION.LIST>
      <EDDPRINTLOCATION.LIST>      </EDDPRINTLOCATION.LIST>
      <EDDPAYABLELOCATION.LIST>      </EDDPAYABLELOCATION.LIST>
      <AVAILABLETRANSACTIONTYPES.LIST>      </AVAILABLETRANSACTIONTYPES.LIST>
      <LEDPAYINSCONFIGS.LIST>      </LEDPAYINSCONFIGS.LIST>
      <TYPECODEDETAILS.LIST>      </TYPECODEDETAILS.LIST>
      <FIELDVALIDATIONDETAILS.LIST>      </FIELDVALIDATIONDETAILS.LIST>
      <INPUTCRALLOCS.LIST>      </INPUTCRALLOCS.LIST>
      <TCSMETHODOFCALCULATION.LIST>      </TCSMETHODOFCALCULATION.LIST>
      <GSTCLASSFNIGSTRATES.LIST>      </GSTCLASSFNIGSTRATES.LIST>
      <EXTARIFFDUTYHEADDETAILS.LIST>      </EXTARIFFDUTYHEADDETAILS.LIST>
      <VOUCHERTYPEPRODUCTCODES.LIST>      </VOUCHERTYPEPRODUCTCODES.LIST>
     </LEDGER>
    </TALLYMESSAGE>`