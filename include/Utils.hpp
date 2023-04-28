#ifndef UTILS_HPP
#define UTILS_HPP

#include <string>
#include <chrono>

/// TERMINAL
const std::string TERMINAL_ERROR    = "\e[1;31m"; //"\033[91m";
const std::string TERMINAL_INFO     = "\033[94m";
const std::string TERMINAL_OK       = "\033[92m";
const std::string TERMINAL_RESET    = "\033[0m";
const std::string TERMINAL_TIMER    = "\033[93m";
const std::string TERMINAL_FILENAME = "\033[95m";
const std::string TERMINAL_WARNING  = "\e[38;5;208m";
const std::string TERMINAL_NOTIF    = "\e[1;36m";


/// FILES
std::string readFile(const std::string& filePath);
std::string getFileExtension(const std::string &fileName);


/// CHRONO
typedef std::chrono::high_resolution_clock clockmicro;
typedef std::chrono::duration<float, std::milli> duration;

void startbenchrono();
void endbenchrono();
uint64_t Get_time_ms();

/// HEAP CORRUPTION
void checkHeap();


#endif