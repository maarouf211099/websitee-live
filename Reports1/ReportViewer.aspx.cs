using Microsoft.Reporting.WebForms;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Security.Principal;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Globalization;

namespace UserUI.reports
{
    public partial class ReportViewer : System.Web.UI.Page
    {
        #region Properties
        //public string ReportName
        //{
        //    get
        //    {
        //        string ReportName = null;

        //        string reportType = Request.QueryString["ReportType"];

        //        switch (reportType)
        //        {
        //            case "CaseDetails":
        //                ReportName = "CaseDetails";
        //                break;
        //            case "InvestigatorPerformanceRate":
        //                ReportName = "InvestigatorPerformanceRate";
        //                break;
        //        }
        //        return ReportName;
        //    }
        //}
        public MersalReports ReportName
        {
            get
            {
                string reportType = Request.QueryString["ReportType"];
                try
                {
                    return (MersalReports)System.Enum.Parse(typeof(MersalReports), reportType);
                }
                catch (Exception ex)
                {
                    return MersalReports.CaseDetails;
                }
            }
        }

        public DateTime? From
        {
            get
            {
                DateTime? _dateFrom;

                if (string.IsNullOrEmpty(Request.QueryString["From"]))
                    _dateFrom = null;
                else {
                    string[] stringSeparators = new string[] { "/" };
                    string[] result = Request.QueryString["From"].Split(stringSeparators, StringSplitOptions.None);
                    DateTime MyDateTime = new DateTime(Int32.Parse(result[0]), Int32.Parse(result[1]), Int32.Parse(result[2]));
                    //MyDateTime = DateTime.ParseExact(Request.QueryString["From"], "yyyy-MM-dd HH:mm tt", null);
                    //DateTime x = DateTime.TryParseExact(Request.QueryString["From"], "yyyy/mm/dd", null, DateTimeStyles.None, out parsedDate)

                    _dateFrom = MyDateTime;//new DateTime(Request.QueryString["From"],);
                }


                return _dateFrom;
                //return DateTime.ParseExact(Request.QueryString["DateFrom"],"dd/MM/yyyy", System.Globalization.CultureInfo.InvariantCulture).ToString("dd/MM/yyyy");
            }
        }


        public DateTime? To
        {
            get
            {
                DateTime? _dateFrom;

                if (string.IsNullOrEmpty(Request.QueryString["To"]))
                    _dateFrom = null;
                else
                {
                    string[] stringSeparators = new string[] { "/" };
                    string[] result = Request.QueryString["To"].Split(stringSeparators, StringSplitOptions.None);
                    DateTime MyDateTime = new DateTime(Int32.Parse(result[0]), Int32.Parse(result[1]), Int32.Parse(result[2]));
                    //MyDateTime = DateTime.ParseExact(Request.QueryString["From"], "yyyy-MM-dd HH:mm tt", null);
                    //DateTime x = DateTime.TryParseExact(Request.QueryString["From"], "yyyy/mm/dd", null, DateTimeStyles.None, out parsedDate)

                    _dateFrom = MyDateTime;//new DateTime(Request.QueryString["From"],);
                }


                return _dateFrom;
                //return DateTime.ParseExact(Request.QueryString["DateTo"], "dd/MM/yyyy", System.Globalization.CultureInfo.InvariantCulture).ToString("dd/MM/yyyy");
            }
        }

        public DateTime? DateFrom
        {
            get
            {
                if (string.IsNullOrEmpty(Request.QueryString["DateFrom"]))
                    return DateTime.Now;
                return ConvertToSystemDateFormat(Request.QueryString["DateFrom"]);
            }
        }


        public DateTime? DateTo
        {
            get
            {
                if (string.IsNullOrEmpty(Request.QueryString["DateTo"]))
                    return DateTime.Now;
                return ConvertToSystemDateFormat(Request.QueryString["DateTo"]);
            }
        }



        public string CaseId
        {
            get
            {
                if (string.IsNullOrEmpty(Request.QueryString["CaseId"]))
                    return null;

                return Request.QueryString["CaseId"];
            }
        }
        public string[] contractor
        {
            get
            {
                if (string.IsNullOrEmpty(Request.QueryString["ContractorID"]))
                    return null;

                return Request.QueryString["ContractorID"].Split(',');
            }
        }


        public string profID
        {
            get
            {
                if (string.IsNullOrEmpty(Request.QueryString["prof"]))
                    return null;

                return Request.QueryString["prof"];
            }
        }
        public string contractorID
        {
            get
            {
                if (string.IsNullOrEmpty(Request.QueryString["ContractorID"]))
                    return null;

                return Request.QueryString["ContractorID"];
            }
        }

        public string remainingDays
        {
            get
            {
                return Request.QueryString["remainingDays"];
            }
        }

        public string ReportUsername
        {
            get
            {
                return ConfigurationManager.AppSettings["ReportUserName"].ToString();
            }
        }
        public string ReportPassword
        {
            get
            {
                return ConfigurationManager.AppSettings["ReportPassword"].ToString();
            }
        }
        public string ReportDomain
        {
            get
            {
                return ConfigurationManager.AppSettings["ReportDomain"].ToString();
            }
        }
        #endregion

        protected void Page_Init(object sender, EventArgs e)
        {
            try
            {
                ReportViewer1.ServerReport.ReportServerCredentials = new ReportServerCredentials(ReportUsername, ReportPassword, ReportDomain);
                ReportViewer1.ProcessingMode = ProcessingMode.Remote;
                //TODO URL
                ReportViewer1.ServerReport.ReportServerUrl = new Uri(ConfigurationManager.AppSettings["ReportServer"].ToString());

                ReportViewer1.ServerReport.ReportPath = string.Format("/MersalReportingServer/{0}", ReportName.ToString());

                ReportViewer1.ServerReport.SetParameters(GetParametersServer());
                ExportReportasPDF(ReportName.ToString());
            }
            catch (Exception ex)
            {
                //TODO log exception
                ExportReportasPDF(ReportName.ToString());
            }
        }

        protected void Page_Load(object sender, EventArgs e)
        {

        }

        #region Helper

        private ReportParameter[] GetParametersServer()
        {
            ReportParameter _dateFrom = new ReportParameter("DateFrom", DateFrom.ToString());
            ReportParameter _dateTo = new ReportParameter("DateTo", DateTo.ToString());
            switch (ReportName)
            {
                case MersalReports.CaseDetails:
                    ReportParameter _caseId = new ReportParameter("CaseId", CaseId);
                    return new ReportParameter[] { _caseId };
                case MersalReports.InvestigatorPerformanceRate:
                    return new ReportParameter[] { _dateFrom, _dateTo };
                case MersalReports.VisitorCaseFollow:
                    return new ReportParameter[] { _dateFrom, _dateTo }; 
                default:
                    return new ReportParameter[] { _dateFrom, _dateTo };
            }
            /*else if (ReportName == "AbsenceReport_1")
             {
                 ReportParameter rcontractor = new ReportParameter("contractorID", contractorID);


                 ReportParameter rsupervisor = new ReportParameter("supervisorid", SupervisiorID);

                 ReportParameter rWorker = new ReportParameter("employeId", Worker);
                 ReportParameter rShift = new ReportParameter("shift", shift);
                 ReportParameter rlocation = new ReportParameter("location", location);


                 ReportParameter rDateFrom = new ReportParameter("From", String.Format("{0:yyyy/MM/dd hh:mm:ss}", Convert.ToDateTime(From.ToString())));

                 ReportParameter rDateTo = new ReportParameter("To",String.Format("{0:yyyy/MM/dd hh:mm:ss}", Convert.ToDateTime( To.ToString())));


                 return new ReportParameter[] { rcontractor, rsupervisor, rWorker, rShift, rlocation, rDateFrom, rDateTo };
             }

            else if (ReportName == "AbsenceReport")
            {

                 ReportParameter rcontractor = new ReportParameter("contractorID", contractorID);
                // rLocation.Values.AddRange(contractor);

                 ReportParameter rSupervisior = new ReportParameter("supervisorid", SupervisiorID);
                 //rSupervisior.Values.AddRange(Supervisior);

                 ReportParameter rWorker = new ReportParameter("employeId",Worker);
                 ReportParameter rShift = new ReportParameter("shift", shift);
                 ReportParameter rlocation = new ReportParameter("location", location);


                 ReportParameter rDateFrom = new ReportParameter("From", DateFrom.ToString());

                     ReportParameter rDateTo = new ReportParameter("To", DateTo.ToString());

                     return new ReportParameter[] { rcontractor,rDateFrom, rDateTo, rSupervisior, rWorker, rShift, rlocation };
             }
             else if (ReportName == "RentVechile")
             {
                 ReportParameter rLocation = new ReportParameter("ContractorID");
                 if (contractor != null)
                 {
                     rLocation.Values.AddRange(contractor);
                 }
                 ReportParameter rVechileType = new ReportParameter("TypeID");
                 if (VechileType != null)
                 {
                     rVechileType.Values.AddRange(VechileType);
                 }
                 return new ReportParameter[] { rLocation, rVechileType };
             }
             else if (ReportName == "OwnedVechile")
             {
                 ReportParameter rLocation = new ReportParameter("ContractorID");
                 if (contractor != null)
                 {
                     rLocation.Values.AddRange(contractor);
                 }
                 ReportParameter rVechileType = new ReportParameter("TypeID");
                 if (VechileType != null)
                 {
                     rVechileType.Values.AddRange(VechileType);
                 }
                 return new ReportParameter[] { rLocation, rVechileType };
             }
             else if (ReportName == "ShiftSummaryReport")
             {
                 ReportParameter rLocation = new ReportParameter("ContractorId", contractorID);


                 ReportParameter rSupervisior = new ReportParameter("SupervisiorID");
                 rSupervisior.Values.AddRange(Supervisior);

                 return new ReportParameter[] { rLocation, rSupervisior };
             }
             else if (ReportName == "VechileDetails")
             {
                 //ReportParameter rLocation = new ReportParameter("ContractorID");
                 //rLocation.Values.AddRange(contractor);


                 ReportParameter ContractorID = new ReportParameter("ContractorID", contractorID);
                 ReportParameter rRFID = new ReportParameter("RFIdNo", RFID);
                 ReportParameter rplateNum = new ReportParameter("PlateNo", plateNum);

                 return new ReportParameter[] { ContractorID, rRFID, rplateNum };
             }
             else if (ReportName == "SingleVehicleReport")
             {
                 //ReportParameter rLocation = new ReportParameter("ContractorID");
                 //rLocation.Values.AddRange(contractor);


                 ReportParameter ContractorID = new ReportParameter("ContractorId", contractorID);
                 ReportParameter rplateNum = new ReportParameter("PlateNo", plateNum);

                 return new ReportParameter[] { ContractorID, rplateNum };
             }
             else if (ReportName == "Vechiles")
             {
                 ReportParameter rLocation = new ReportParameter("ContractorID");
                 if (contractor != null)
                 {
                     rLocation.Values.AddRange(contractor);
                 }


                 return new ReportParameter[] { rLocation };
             }

             else if (ReportName == "FleetOperationalPlanReport")
             {
                 ReportParameter rLocation = new ReportParameter("ContractorId",contractorID);
                 ReportParameter rPalnId = new ReportParameter("PlanId",PlanId);
                 ReportParameter rMunaciplity = new ReportParameter("MunaciplityId");
                 ReportParameter rServiceTypeId = new ReportParameter("ServiceTypeId");
                 if (MunicipalityMltuiValue != null)
                 {
                     rMunaciplity.Values.AddRange(MunicipalityMltuiValue);
                 }

                 if (ServiceTypeMltuiValue != null)
                 {
                     rServiceTypeId.Values.AddRange(ServiceTypeMltuiValue);
                 }



                 return new ReportParameter[] { rPalnId, rLocation, rMunaciplity, rServiceTypeId };
             }
             else if (ReportName == "EmployeeOperationalPlanReport")
             {
                 ReportParameter rLocation = new ReportParameter("ContractorId", contractorID);
                 ReportParameter rPalnId = new ReportParameter("PlanId", PlanId);
                 ReportParameter rMunaciplity = new ReportParameter("MunaciplityId");
                 ReportParameter rServiceTypeId = new ReportParameter("ServiceTypeId");
                 if (MunicipalityMltuiValue != null)
                 {
                     rMunaciplity.Values.AddRange(MunicipalityMltuiValue);
                 }

                 if (ServiceTypeMltuiValue != null)
                 {
                     rServiceTypeId.Values.AddRange(ServiceTypeMltuiValue);
                 }



                 return new ReportParameter[] { rPalnId, rServiceTypeId, rLocation, rMunaciplity };
             }
             else if (ReportName == "ClutterDistrubtion")
             {
                 ReportParameter rLocation = new ReportParameter("ContractorId", contractorID);
                 ReportParameter rPalnId = new ReportParameter("planid", PlanId);
                 ReportParameter rMunaciplity = new ReportParameter("MunaciplityId");

                 if (MunicipalityMltuiValue != null)
                 {
                     rMunaciplity.Values.AddRange(MunicipalityMltuiValue);
                 }

                 return new ReportParameter[] { rPalnId, rLocation, rMunaciplity };
             }
             else if (ReportName == "RentedVehicleAboutToFinish")
             {
                 ReportParameter rRemainingDays = new ReportParameter("RemainingDays", remainingDays);
                 return new ReportParameter[] { rRemainingDays };
             }
             else if (ReportName == "EmployeeExeclusionReport")
             {
                 ReportParameter ContractorID = new ReportParameter("ContractorId", contractorID);
                 ReportParameter rDateFrom = new ReportParameter("from", String.Format("{0:yyyy/MM/dd}", Convert.ToDateTime(From.ToString())));
                 ReportParameter rDateTo = new ReportParameter("to", String.Format("{0:yyyy/MM/dd}", Convert.ToDateTime(To.ToString())));

                 return new ReportParameter[] { ContractorID, rDateFrom, rDateTo };
             }
             else if (ReportName == "EmployeeReplacementHistory")
             {
                 ReportParameter ContractorID = new ReportParameter("ContractorId", contractorID);
                 ReportParameter rDateFrom = new ReportParameter("from", String.Format("{0:yyyy/MM/dd}", Convert.ToDateTime(From.ToString())));
                 ReportParameter rDateTo = new ReportParameter("to",  String.Format("{0:yyyy/MM/dd}", Convert.ToDateTime(To.ToString())));

                 return new ReportParameter[] { ContractorID, rDateFrom, rDateTo };
             }

                 else if (ReportName == "ShiftWorkersReport")
             {
                 ReportParameter ContractorID = new ReportParameter("ContractorId", contractorID);


                 return new ReportParameter[] { ContractorID };
             }
             else if (ReportName == "TotalShiftWorkersReport")
             {
                 ReportParameter ContractorID = new ReportParameter("ContractorId", contractorID);


                 return new ReportParameter[] { ContractorID };
             }
             else if (ReportName == "OprationalPlan")
             {
                 ReportParameter RptPlanId = new ReportParameter("PlanId", PlanId);


                 return new ReportParameter[] { RptPlanId };
             }
             else if (ReportName == "EmployeeAccountsreport")
             {
                 ReportParameter ContractorID = new ReportParameter("ContractorId", contractorID);
                 ReportParameter RptprofID = new ReportParameter("ProfissionId", profID);
                 ReportParameter Rptusername = new ReportParameter("username", username);

                 return new ReportParameter[] { ContractorID, RptprofID, Rptusername };
             }*/
            return null;
        }

        public static DateTime ConvertToSystemDateFormat(string strddMMyyyy)
        {
            DateTime selectedDate = DateTime.Now;
            try
            {

                string[] slectedDateArray = strddMMyyyy.Substring(0, strddMMyyyy.Split(' ')[0].Length).Split('/', '-');

                if (slectedDateArray.Length == 3)
                {
                    int arg0;
                    int.TryParse(slectedDateArray[0], out arg0);

                    int arg1;
                    int.TryParse(slectedDateArray[1], out arg1);

                    int arg2;
                    int.TryParse(slectedDateArray[2], out arg2);

                    try
                    {
                        selectedDate = new DateTime(arg2, arg0, arg1);
                    }
                    catch (Exception ex)
                    {
                        try
                        {
                            selectedDate = new DateTime(arg2, arg1, arg0);
                        }
                        catch (Exception ex2)
                        {
                        }
                    }
                }

            }
            catch (Exception ex)
            {

            }
            return selectedDate;
        }

        private void ExportReportasPDF(string Report_Name)
        {
            Warning[] warnings;
            string[] streamids;

            //mime type for download like (application/pdf)
            string mimeType;
            string encoding;
            //file Extenstion
            string filenameExtension;

            //Get Parameters
            ReportParameterInfoCollection pInfo = ReportViewer1.ServerReport.GetParameters();

            // Set Report Name like (tracing) without path
            string filename = Report_Name;
            System.IO.File.Delete(filename);

            byte[] bytes;

            if (ReportViewer1.ProcessingMode == ProcessingMode.Local)
            {
                //get bytyes from Report Viewer
                bytes = ReportViewer1.LocalReport.Render("PDF", null, out mimeType,
                 out encoding, out filenameExtension, out streamids, out warnings);
            }
            else
            {
                bytes = ReportViewer1.ServerReport.Render("PDF", null, out mimeType,
                 out encoding, out filenameExtension, out streamids, out warnings);
            }

            //get full Path
            //string filepath = System.IO.Path.Combine(System.IO.Path.GetTempPath(), filename + ".pdf");
            //using (System.IO.FileStream fs = new System.IO.FileStream(filepath, System.IO.FileMode.Create))
            //{
            //    fs.Write(bytes, 0, bytes.Length);

            //}

            if (bytes != null)
            {
                Response.ContentType = "application/pdf";
                Response.AddHeader("content-length", bytes.Length.ToString());
                Response.BinaryWrite(bytes);
            }

            ////Response.Buffer = true;
            ////Response.Clear();
            //Response.ContentType = mimeType;
            //Response.AddHeader("content-disposition", "attachment; filename= " + filename + ".pdf");
            //Response.OutputStream.Write(bytes, 0, bytes.Length); // create the file
            //Response.BinaryWrite(bytes);
            //return;
            /* Response.Flush(); // send it to the client to download  
             Response.End();*/
        }

        #endregion

        #region Handle report Credintials

        /// <summary>
        /// Local implementation of IReportServerCredentials
        /// </summary>
        public class ReportServerCredentials : IReportServerCredentials
        {
            private string _userName;
            private string _password;
            private string _domain;

            public ReportServerCredentials(string userName, string password, string domain)
            {
                _userName = userName;
                _password = password;
                _domain = domain;
            }

            public WindowsIdentity ImpersonationUser
            {
                get
                {
                    // Use default identity.
                    return null;
                }
            }

            public ICredentials NetworkCredentials
            {
                get
                {
                    // Use default identity.
                    return new NetworkCredential(_userName, _password, _domain);
                }
            }

            public bool GetFormsCredentials(out Cookie authCookie, out string user, out string password, out string authority)
            {
                // Do not use forms credentials to authenticate.
                authCookie = null;
                user = password = authority = null;
                return false;
            }
        }

        #endregion
    }

    public enum MersalReports
    {
        CaseDetails = 1,
        InvestigatorPerformanceRate = 2,
        VisitorCaseFollow = 3,
        CaseDisease = 4,
        CaseServices = 5,
        DisesaseWithGovernorate = 6,
        CaseAssistant = 7,
    }
}