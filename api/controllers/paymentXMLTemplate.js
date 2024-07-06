const dayjs = require('dayjs')

exports.baseFileData = (data) =>`
<ENVELOPE>
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
   <REQUESTDATA>
    ${data.map(ele=>ele).join('')}
   </REQUESTDATA>
  </IMPORTDATA>
 </BODY>
</ENVELOPE>
`


exports.txnData=({customerName, customerNumber, billedDate, paymentType, items, totalPrice}) => 
    `
    <TALLYMESSAGE xmlns:UDF="TallyUDF">
     <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Invoice Voucher View">
      <ADDRESS.LIST TYPE="String">
       <ADDRESS>${customerName}</ADDRESS>
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
      <PARTYNAME>${paymentType==='CASH' ? 'CASH' : customerName}</PARTYNAME>
      <PARTYLEDGERNAME>${paymentType==='CASH' ? 'CASH' : customerName}</PARTYLEDGERNAME>
      <PARTYMAILINGNAME>${paymentType==='CASH' ? 'CASH' : customerName}</PARTYMAILINGNAME>
      <CONSIGNEEMAILINGNAME>${customerName}</CONSIGNEEMAILINGNAME>
      <CONSIGNEESTATENAME>Karnataka</CONSIGNEESTATENAME>
      <VOUCHERNUMBER>1</VOUCHERNUMBER>
      <BASICBASEPARTYNAME>${paymentType==='CASH' ? 'CASH' : customerName}</BASICBASEPARTYNAME>
      <CSTFORMISSUETYPE/>
      <CSTFORMRECVTYPE/>
      <FBTPAYMENTTYPE>Default</FBTPAYMENTTYPE>
      <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
      <BASICBUYERNAME>${paymentType==='CASH' ? 'CASH' : customerName}</BASICBUYERNAME>
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
      <HASCASHFLOW>Yes</HASCASHFLOW>
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
       <RATE>${rate}/NOs</RATE>
       <AMOUNT>${rate*quantity}</AMOUNT>
       <ACTUALQTY> ${quantity} NOs</ACTUALQTY>
       <BILLEDQTY> ${quantity} NOs</BILLEDQTY>
       <BATCHALLOCATIONS.LIST>
        <GODOWNNAME>Main Location</GODOWNNAME>
        <BATCHNAME>Primary Batch</BATCHNAME>
        <INDENTNO/>
        <ORDERNO/>
        <TRACKINGNUMBER/>
        <DYNAMICCSTISCLEARED>No</DYNAMICCSTISCLEARED>
        <AMOUNT>${rate*quantity}</AMOUNT>
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
        <AMOUNT>${rate*quantity}</AMOUNT>
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
       <LEDGERNAME>${paymentType==='CASH' ? 'CASH' : customerName}</LEDGERNAME>
       <GSTCLASS/>
       <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
       <LEDGERFROMITEM>No</LEDGERFROMITEM>
       <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
       <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
       <ISLASTDEEMEDPOSITIVE>Yes</ISLASTDEEMEDPOSITIVE>
       <ISCAPVATTAXALTERED>No</ISCAPVATTAXALTERED>
       <ISCAPVATNOTCLAIMED>No</ISCAPVATNOTCLAIMED>
       ${totalPrice ? `<AMOUNT>-${totalPrice}</AMOUNT>` : ''}
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
      <PAYROLLMODEOFPAYMENT.LIST>      </PAYROLLMODEOFPAYMENT.LIST>
      <ATTDRECORDS.LIST>      </ATTDRECORDS.LIST>
      <GSTEWAYCONSIGNORADDRESS.LIST>      </GSTEWAYCONSIGNORADDRESS.LIST>
      <GSTEWAYCONSIGNEEADDRESS.LIST>      </GSTEWAYCONSIGNEEADDRESS.LIST>
      <TEMPGSTRATEDETAILS.LIST>      </TEMPGSTRATEDETAILS.LIST>
     </VOUCHER>
    </TALLYMESSAGE>`