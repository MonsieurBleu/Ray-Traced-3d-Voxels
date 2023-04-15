#ifndef UTILS_HPP
#define UTILS_HPP

#include <string>

const std::string TERMINAL_ERROR = "\033[91m";
const std::string TERMINAL_INFO  = "\033[94m";
const std::string TERMINAL_OK    = "\033[92m";
const std::string TERMINAL_RESET = "\033[0m";

std::string readFile(const std::string& filePath);

std::string getFileExtension(const std::string &fileName);

#endif

// class bcolors:
//     HEADER = '\033[95m'
//     OKBLUE = '\033[94m'
//     OKGREEN = '\033[92m'
//     WARNING = '\033[93m'
//     FAIL = '\033[91m'
//     ENDC = '\033[0m'